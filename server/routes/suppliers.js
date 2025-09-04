const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility } = require('../middleware/auth');
const BaseModel = require('../models/BaseModel');
const logger = require('../utils/logger');

const router = express.Router();
const Supplier = new BaseModel('suppliers');

/**
 * Get all suppliers
 * GET /api/suppliers
 */
router.get('/', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const {
    facility_id,
    is_active,
    search,
    page = 1,
    limit = 50,
    order_by = 'name',
    order_direction = 'asc'
  } = req.query;

  const facilityId = facility_id || req.user.facility_id;
  
  // Authorize facility access
  await authorizeFacility(req, facilityId);

  let query = Supplier.db('suppliers')
    .where('facility_id', facilityId);

  // Apply filters
  if (is_active !== undefined) {
    query = query.where('is_active', is_active === 'true');
  }

  if (search) {
    query = query.where(function() {
      this.where('name', 'ilike', `%${search}%`)
          .orWhere('contact_person', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
    });
  }

  // Apply ordering
  query = query.orderBy(order_by, order_direction);

  // Apply pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query.limit(parseInt(limit)).offset(offset);

  const suppliers = await query;

  res.json({
    success: true,
    data: suppliers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: suppliers.length
    }
  });
}));

/**
 * Get supplier by ID
 * GET /api/suppliers/:id
 */
router.get('/:id', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, supplier.facility_id);

  res.json({
    success: true,
    data: supplier
  });
}));

/**
 * Create new supplier
 * POST /api/suppliers
 */
router.post('/', auth, requirePermission('inventory:create'), asyncHandler(async (req, res) => {
  const supplierData = {
    ...req.body,
    facility_id: req.body.facility_id || req.user.facility_id,
    is_active: true
  };

  // Authorize facility access
  await authorizeFacility(req, supplierData.facility_id);

  const supplier = await Supplier.create(supplierData);

  logger.info(`User ${req.user.username} created supplier: ${supplier.name}`);

  res.status(201).json({
    success: true,
    data: supplier,
    message: 'Supplier created successfully'
  });
}));

/**
 * Update supplier
 * PUT /api/suppliers/:id
 */
router.put('/:id', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingSupplier = await Supplier.findById(id);
  if (!existingSupplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingSupplier.facility_id);

  const updatedSupplier = await Supplier.update(id, req.body);

  logger.info(`User ${req.user.username} updated supplier: ${updatedSupplier.name}`);

  res.json({
    success: true,
    data: updatedSupplier,
    message: 'Supplier updated successfully'
  });
}));

/**
 * Delete supplier (soft delete)
 * DELETE /api/suppliers/:id
 */
router.delete('/:id', auth, requirePermission('inventory:delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingSupplier = await Supplier.findById(id);
  if (!existingSupplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingSupplier.facility_id);

  await Supplier.update(id, { is_active: false });

  logger.info(`User ${req.user.username} deactivated supplier: ${existingSupplier.name}`);

  res.json({
    success: true,
    message: 'Supplier deactivated successfully'
  });
}));

module.exports = router;