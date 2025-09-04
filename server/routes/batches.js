const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility, logActivity } = require('../middleware/auth');
const { Batch, Plant } = require('../models');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const createBatchValidation = [
  body('facility_id').isInt({ min: 1 }).withMessage('Valid facility ID is required'),
  body('strain_id').optional().isInt({ min: 1 }).withMessage('Strain ID must be a valid integer'),
  body('room_id').optional().isInt({ min: 1 }).withMessage('Room ID must be a valid integer'),
  body('batch_number').trim().isLength({ min: 1, max: 50 }).withMessage('Batch number is required and must be less than 50 characters'),
  body('batch_name').optional().trim().isLength({ max: 100 }).withMessage('Batch name must be less than 100 characters'),
  body('batch_type').isIn(['seed', 'clone', 'mother']).withMessage('Batch type must be seed, clone, or mother'),
  body('growth_phase').isIn(['seedling', 'clone', 'vegetative', 'pre-flower', 'flower', 'late-flower', 'harvest-ready', 'harvested']).withMessage('Invalid growth phase'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('expected_harvest_date').optional().isISO8601().withMessage('Valid expected harvest date required'),
  body('parent_batch_id').optional().isInt({ min: 1 }).withMessage('Parent batch ID must be a valid integer'),
  body('plant_count').optional().isInt({ min: 0 }).withMessage('Plant count must be a non-negative integer')
];

const updateBatchValidation = [
  body('batch_name').optional().trim().isLength({ max: 100 }).withMessage('Batch name must be less than 100 characters'),
  body('growth_phase').optional().isIn(['seedling', 'clone', 'vegetative', 'pre-flower', 'flower', 'late-flower', 'harvest-ready', 'harvested']).withMessage('Invalid growth phase'),
  body('room_id').optional().isInt({ min: 1 }).withMessage('Room ID must be a valid integer'),
  body('expected_harvest_date').optional().isISO8601().withMessage('Valid expected harvest date required'),
  body('actual_harvest_date').optional().isISO8601().withMessage('Valid actual harvest date required'),
  body('status').optional().isIn(['active', 'completed', 'destroyed', 'transferred']).withMessage('Invalid status')
];

const moveBatchValidation = [
  body('new_room_id').isInt({ min: 1 }).withMessage('Valid new room ID is required'),
  body('reason').optional().trim().isLength({ max: 255 }).withMessage('Reason must be less than 255 characters')
];

const splitBatchValidation = [
  body('splits').isArray({ min: 1 }).withMessage('Splits array is required'),
  body('splits.*.batch_number').trim().isLength({ min: 1, max: 50 }).withMessage('Each split must have a valid batch number'),
  body('splits.*.batch_name').optional().trim().isLength({ max: 100 }).withMessage('Batch name must be less than 100 characters'),
  body('splits.*.plant_ids').isArray({ min: 1 }).withMessage('Each split must have at least one plant ID'),
  body('splits.*.plant_ids.*').isInt({ min: 1 }).withMessage('All plant IDs must be valid integers'),
  body('splits.*.room_id').optional().isInt({ min: 1 }).withMessage('Room ID must be a valid integer')
];

// @desc    Get all batches
// @route   GET /api/v1/batches
// @access  Private (batch.view permission)
router.get('/',
  auth,
  requirePermission('batch.view'),
  authorizeFacility,
  logActivity('view_batches'),
  asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      strain_id, 
      room_id, 
      growth_phase, 
      batch_type, 
      status,
      search 
    } = req.query;

    const filters = {
      facility_id: req.user.facilityId
    };

    if (strain_id) filters.strain_id = parseInt(strain_id);
    if (room_id) filters.room_id = parseInt(room_id);
    if (growth_phase) filters.growth_phase = growth_phase;
    if (batch_type) filters.batch_type = batch_type;
    if (status) filters.status = status;

    const options = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      orderBy: 'batches.created_at',
      orderDirection: 'desc'
    };

    const batches = await Batch.findAllWithRelations(filters, options);
    const totalCount = await Batch.count(filters);

    // Filter by search if provided
    let filteredBatches = batches;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBatches = batches.filter(batch => 
        batch.batch_number.toLowerCase().includes(searchLower) ||
        batch.batch_name?.toLowerCase().includes(searchLower) ||
        batch.strain_name?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: {
        batches: filteredBatches.map(batch => ({
          id: batch.id,
          batchNumber: batch.batch_number,
          batchName: batch.batch_name,
          batchType: batch.batch_type,
          growthPhase: batch.growth_phase,
          status: batch.status,
          facilityId: batch.facility_id,
          strainId: batch.strain_id,
          strainName: batch.strain_name,
          strainType: batch.strain_type,
          genetics: batch.genetics,
          roomId: batch.room_id,
          roomName: batch.room_name,
          roomType: batch.room_type,
          parentBatchId: batch.parent_batch_id,
          parentBatchNumber: batch.parent_batch_number,
          plantCount: batch.plant_count,
          startDate: batch.start_date,
          expectedHarvestDate: batch.expected_harvest_date,
          actualHarvestDate: batch.actual_harvest_date,
          cultivationNotes: batch.cultivation_notes,
          environmentalData: batch.environmental_data,
          tags: batch.tags,
          createdAt: batch.created_at,
          updatedAt: batch.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  })
);

// @desc    Get batch by ID
// @route   GET /api/v1/batches/:id
// @access  Private (batch.view permission)
router.get('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  auth,
  requirePermission('batch.view'),
  authorizeFacility,
  logActivity('view_batch'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batch = await Batch.findByIdWithRelations(parseInt(req.params.id));
    
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (batch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view this batch');
    }

    res.json({
      success: true,
      data: {
        batch: {
          id: batch.id,
          batchNumber: batch.batch_number,
          batchName: batch.batch_name,
          batchType: batch.batch_type,
          growthPhase: batch.growth_phase,
          status: batch.status,
          facilityId: batch.facility_id,
          strainId: batch.strain_id,
          strainName: batch.strain_name,
          strainType: batch.strain_type,
          genetics: batch.genetics,
          roomId: batch.room_id,
          roomName: batch.room_name,
          roomType: batch.room_type,
          parentBatchId: batch.parent_batch_id,
          parentBatchNumber: batch.parent_batch_number,
          plantCount: batch.plant_count,
          startDate: batch.start_date,
          expectedHarvestDate: batch.expected_harvest_date,
          actualHarvestDate: batch.actual_harvest_date,
          cultivationNotes: batch.cultivation_notes,
          environmentalData: batch.environmental_data,
          tags: batch.tags,
          createdAt: batch.created_at,
          updatedAt: batch.updated_at
        }
      }
    });
  })
);

// @desc    Create new batch
// @route   POST /api/v1/batches
// @access  Private (batch.manage permission)
router.post('/',
  createBatchValidation,
  auth,
  requirePermission('batch.manage'),
  authorizeFacility,
  logActivity('create_batch'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const {
      facility_id,
      strain_id,
      room_id,
      batch_number,
      batch_name,
      batch_type,
      growth_phase,
      start_date,
      expected_harvest_date,
      parent_batch_id,
      plant_count
    } = req.body;

    // Ensure user can only create batches in their facility
    if (facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to create batches in this facility');
    }

    const batchData = {
      facility_id,
      strain_id: strain_id || null,
      room_id: room_id || null,
      batch_number,
      batch_name: batch_name || null,
      batch_type,
      growth_phase,
      start_date,
      expected_harvest_date: expected_harvest_date || null,
      parent_batch_id: parent_batch_id || null,
      plant_count: plant_count || 0
    };

    const newBatch = await Batch.create(batchData);

    authLogger.info('Batch created', {
      batchId: newBatch.id,
      batchNumber: newBatch.batch_number,
      batchType: newBatch.batch_type,
      createdByUserId: req.user.id,
      createdByUsername: req.user.username,
      facilityId: facility_id
    });

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: {
        batch: {
          id: newBatch.id,
          batchNumber: newBatch.batch_number,
          batchName: newBatch.batch_name,
          batchType: newBatch.batch_type,
          growthPhase: newBatch.growth_phase,
          status: newBatch.status,
          facilityId: newBatch.facility_id,
          strainId: newBatch.strain_id,
          roomId: newBatch.room_id,
          parentBatchId: newBatch.parent_batch_id,
          plantCount: newBatch.plant_count,
          startDate: newBatch.start_date,
          expectedHarvestDate: newBatch.expected_harvest_date,
          createdAt: newBatch.created_at
        }
      }
    });
  })
);

// @desc    Update batch
// @route   PUT /api/v1/batches/:id
// @access  Private (batch.update permission)
router.put('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  updateBatchValidation,
  auth,
  requirePermission('batch.update'),
  authorizeFacility,
  logActivity('update_batch'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.id);
    const { 
      batch_name, 
      growth_phase, 
      room_id, 
      expected_harvest_date, 
      actual_harvest_date, 
      status 
    } = req.body;

    const existingBatch = await Batch.findById(batchId);
    if (!existingBatch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (existingBatch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to update this batch');
    }

    const updateData = {};
    if (batch_name) updateData.batch_name = batch_name;
    if (growth_phase) updateData.growth_phase = growth_phase;
    if (room_id) updateData.room_id = room_id;
    if (expected_harvest_date) updateData.expected_harvest_date = expected_harvest_date;
    if (actual_harvest_date) updateData.actual_harvest_date = actual_harvest_date;
    if (status) updateData.status = status;

    const updatedBatch = await Batch.update(batchId, updateData);

    authLogger.info('Batch updated', {
      batchId: batchId,
      batchNumber: existingBatch.batch_number,
      updatedByUserId: req.user.id,
      updatedByUsername: req.user.username,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: {
        batch: {
          id: updatedBatch.id,
          batchNumber: updatedBatch.batch_number,
          batchName: updatedBatch.batch_name,
          growthPhase: updatedBatch.growth_phase,
          roomId: updatedBatch.room_id,
          expectedHarvestDate: updatedBatch.expected_harvest_date,
          actualHarvestDate: updatedBatch.actual_harvest_date,
          status: updatedBatch.status,
          updatedAt: updatedBatch.updated_at
        }
      }
    });
  })
);

// @desc    Move batch to different room
// @route   POST /api/v1/batches/:id/move
// @access  Private (batch.update permission)
router.post('/:id/move',
  [param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  moveBatchValidation,
  auth,
  requirePermission('batch.update'),
  authorizeFacility,
  logActivity('move_batch'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.id);
    const { new_room_id, reason } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (batch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to move this batch');
    }

    const updatedBatch = await Batch.moveBatch(batchId, new_room_id, req.user.id, reason);

    authLogger.info('Batch moved', {
      batchId: batchId,
      batchNumber: batch.batch_number,
      fromRoomId: batch.room_id,
      toRoomId: new_room_id,
      movedByUserId: req.user.id,
      movedByUsername: req.user.username,
      reason: reason
    });

    res.json({
      success: true,
      message: 'Batch moved successfully',
      data: {
        batch: {
          id: updatedBatch.id,
          batchNumber: updatedBatch.batch_number,
          roomId: updatedBatch.room_id,
          updatedAt: updatedBatch.updated_at
        }
      }
    });
  })
);

// @desc    Update batch growth phase
// @route   POST /api/v1/batches/:id/phase
// @access  Private (batch.update permission)
router.post('/:id/phase',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required'),
    body('new_phase').isIn(['seedling', 'clone', 'vegetative', 'pre-flower', 'flower', 'late-flower', 'harvest-ready', 'harvested']).withMessage('Invalid growth phase')
  ],
  auth,
  requirePermission('batch.update'),
  authorizeFacility,
  logActivity('update_batch_phase'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.id);
    const { new_phase } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (batch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to update this batch');
    }

    const updatedBatch = await Batch.updateGrowthPhase(batchId, new_phase, req.user.id);

    authLogger.info('Batch growth phase updated', {
      batchId: batchId,
      batchNumber: batch.batch_number,
      fromPhase: batch.growth_phase,
      toPhase: new_phase,
      updatedByUserId: req.user.id,
      updatedByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'Batch growth phase updated successfully',
      data: {
        batch: {
          id: updatedBatch.id,
          batchNumber: updatedBatch.batch_number,
          growthPhase: updatedBatch.growth_phase,
          expectedHarvestDate: updatedBatch.expected_harvest_date,
          updatedAt: updatedBatch.updated_at
        }
      }
    });
  })
);

// @desc    Get batch statistics
// @route   GET /api/v1/batches/:id/stats
// @access  Private (batch.view permission)
router.get('/:id/stats',
  [param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  auth,
  requirePermission('batch.view'),
  authorizeFacility,
  logActivity('view_batch_stats'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.id);

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (batch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view this batch');
    }

    const stats = await Batch.getBatchStats(batchId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// @desc    Get batch timeline
// @route   GET /api/v1/batches/:id/timeline
// @access  Private (batch.view permission)
router.get('/:id/timeline',
  [param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  auth,
  requirePermission('batch.view'),
  authorizeFacility,
  logActivity('view_batch_timeline'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.id);

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (batch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view this batch');
    }

    const timeline = await Batch.getBatchTimeline(batchId);

    res.json({
      success: true,
      data: timeline
    });
  })
);

// @desc    Split batch
// @route   POST /api/v1/batches/:id/split
// @access  Private (batch.manage permission)
router.post('/:id/split',
  [param('id').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  splitBatchValidation,
  auth,
  requirePermission('batch.manage'),
  authorizeFacility,
  logActivity('split_batch'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.id);
    const { splits } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check facility authorization
    if (batch.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to split this batch');
    }

    // Validate that all plant IDs belong to this batch
    const allPlantIds = splits.flatMap(split => split.plant_ids);
    const plants = await Plant.db('plants')
      .whereIn('id', allPlantIds)
      .where('batch_id', batchId);

    if (plants.length !== allPlantIds.length) {
      throw new ApiError(400, 'Some plant IDs do not belong to this batch');
    }

    const splitData = { splits };
    const newBatches = await Batch.splitBatch(batchId, splitData, req.user.id);

    authLogger.info('Batch split', {
      originalBatchId: batchId,
      originalBatchNumber: batch.batch_number,
      newBatchCount: newBatches.length,
      newBatchIds: newBatches.map(b => b.id),
      splitByUserId: req.user.id,
      splitByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'Batch split successfully',
      data: {
        originalBatch: {
          id: batchId,
          batchNumber: batch.batch_number
        },
        newBatches: newBatches.map(batch => ({
          id: batch.id,
          batchNumber: batch.batch_number,
          batchName: batch.batch_name,
          plantCount: batch.plant_count,
          roomId: batch.room_id,
          createdAt: batch.created_at
        }))
      }
    });
  })
);

// @desc    Get active batches
// @route   GET /api/v1/batches/active
// @access  Private (batch.view permission)
router.get('/active/list',
  auth,
  requirePermission('batch.view'),
  authorizeFacility,
  logActivity('view_active_batches'),
  asyncHandler(async (req, res) => {
    const { growth_phase, room_id } = req.query;

    const options = {
      orderBy: 'batches.start_date',
      orderDirection: 'desc'
    };

    let filters = { 
      facility_id: req.user.facilityId, 
      status: 'active' 
    };

    if (growth_phase) filters.growth_phase = growth_phase;
    if (room_id) filters.room_id = parseInt(room_id);

    const activeBatches = await Batch.findAllWithRelations(filters, options);

    res.json({
      success: true,
      data: {
        batches: activeBatches.map(batch => ({
          id: batch.id,
          batchNumber: batch.batch_number,
          batchName: batch.batch_name,
          batchType: batch.batch_type,
          growthPhase: batch.growth_phase,
          strainName: batch.strain_name,
          roomName: batch.room_name,
          plantCount: batch.plant_count,
          startDate: batch.start_date,
          expectedHarvestDate: batch.expected_harvest_date,
          createdAt: batch.created_at
        }))
      }
    });
  })
);

// @desc    Get batches by facility
// @route   GET /api/v1/batches/facility/:facilityId
// @access  Private (batch.view permission)
router.get('/facility/:facilityId',
  [param('facilityId').isInt({ min: 1 }).withMessage('Valid facility ID is required')],
  auth,
  requirePermission('batch.view'),
  authorizeFacility,
  logActivity('view_facility_batches'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const facilityId = parseInt(req.params.facilityId);
    const { status = 'active' } = req.query;

    const batches = await Batch.findByFacility(facilityId, {
      orderBy: 'batches.created_at',
      orderDirection: 'desc'
    });

    const filteredBatches = status !== 'all' 
      ? batches.filter(batch => batch.status === status)
      : batches;

    res.json({
      success: true,
      data: {
        facilityId: facilityId,
        batches: filteredBatches.map(batch => ({
          id: batch.id,
          batchNumber: batch.batch_number,
          batchName: batch.batch_name,
          batchType: batch.batch_type,
          growthPhase: batch.growth_phase,
          status: batch.status,
          strainName: batch.strain_name,
          roomName: batch.room_name,
          plantCount: batch.plant_count,
          startDate: batch.start_date,
          expectedHarvestDate: batch.expected_harvest_date,
          createdAt: batch.created_at
        }))
      }
    });
  })
);

module.exports = router;