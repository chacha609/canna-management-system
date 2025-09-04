const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility } = require('../middleware/auth');
const BaseModel = require('../models/BaseModel');
const logger = require('../utils/logger');

const router = express.Router();
const Category = new BaseModel('inventory_categories');

/**
 * Get all inventory categories
 * GET /api/categories
 */
router.get('/', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const {
    facility_id,
    category_type,
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

  let query = Category.db('inventory_categories')
    .where('facility_id', facilityId);

  // Apply filters
  if (category_type) {
    query = query.where('category_type', category_type);
  }

  if (is_active !== undefined) {
    query = query.where('is_active', is_active === 'true');
  }

  if (search) {
    query = query.where(function() {
      this.where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
    });
  }

  // Apply ordering
  query = query.orderBy(order_by, order_direction);

  // Apply pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query.limit(parseInt(limit)).offset(offset);

  const categories = await query;

  res.json({
    success: true,
    data: categories,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: categories.length
    }
  });
}));

/**
 * Get category by ID
 * GET /api/categories/:id
 */
router.get('/:id', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, category.facility_id);

  res.json({
    success: true,
    data: category
  });
}));

/**
 * Create new category
 * POST /api/categories
 */
router.post('/', auth, requirePermission('inventory:create'), asyncHandler(async (req, res) => {
  const categoryData = {
    ...req.body,
    facility_id: req.body.facility_id || req.user.facility_id,
    is_active: true
  };

  // Authorize facility access
  await authorizeFacility(req, categoryData.facility_id);

  const category = await Category.create(categoryData);

  logger.info(`User ${req.user.username} created inventory category: ${category.name}`);

  res.status(201).json({
    success: true,
    data: category,
    message: 'Category created successfully'
  });
}));

/**
 * Update category
 * PUT /api/categories/:id
 */
router.put('/:id', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingCategory = await Category.findById(id);
  if (!existingCategory) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingCategory.facility_id);

  const updatedCategory = await Category.update(id, req.body);

  logger.info(`User ${req.user.username} updated inventory category: ${updatedCategory.name}`);

  res.json({
    success: true,
    data: updatedCategory,
    message: 'Category updated successfully'
  });
}));

/**
 * Delete category (soft delete)
 * DELETE /api/categories/:id
 */
router.delete('/:id', auth, requirePermission('inventory:delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingCategory = await Category.findById(id);
  if (!existingCategory) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingCategory.facility_id);

  // Check if category is in use
  const itemsUsingCategory = await Category.db('inventory_items')
    .where('category_id', id)
    .where('is_active', true)
    .count('* as count')
    .first();

  if (parseInt(itemsUsingCategory.count) > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category. ${itemsUsingCategory.count} items are using this category.`
    });
  }

  await Category.update(id, { is_active: false });

  logger.info(`User ${req.user.username} deactivated inventory category: ${existingCategory.name}`);

  res.json({
    success: true,
    message: 'Category deactivated successfully'
  });
}));

/**
 * Get category statistics
 * GET /api/categories/:id/stats
 */
router.get('/:id/stats', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, category.facility_id);

  // Get items count
  const itemsCount = await Category.db('inventory_items')
    .where('category_id', id)
    .where('is_active', true)
    .count('* as count')
    .first();

  // Get total value
  const totalValue = await Category.db('inventory_items')
    .where('category_id', id)
    .where('is_active', true)
    .sum(Category.db.raw('current_quantity * unit_cost'))
    .first();

  // Get low stock items count
  const lowStockCount = await Category.db('inventory_items')
    .where('category_id', id)
    .where('is_active', true)
    .whereRaw('current_quantity <= reorder_point')
    .count('* as count')
    .first();

  res.json({
    success: true,
    data: {
      category_name: category.name,
      total_items: parseInt(itemsCount.count),
      total_value: parseFloat(totalValue.sum) || 0,
      low_stock_items: parseInt(lowStockCount.count)
    }
  });
}));

module.exports = router;