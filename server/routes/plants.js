
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility, logActivity } = require('../middleware/auth');
const { Plant, Batch } = require('../models');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const createPlantValidation = [
  body('facility_id').isInt({ min: 1 }).withMessage('Valid facility ID is required'),
  body('strain_id').isInt({ min: 1 }).withMessage('Valid strain ID is required'),
  body('batch_id').isInt({ min: 1 }).withMessage('Valid batch ID is required'),
  body('plant_tag').trim().isLength({ min: 1, max: 50 }).withMessage('Plant tag is required and must be less than 50 characters'),
  body('plant_type').isIn(['seed', 'clone', 'mother']).withMessage('Plant type must be seed, clone, or mother'),
  body('growth_phase').isIn(['seedling', 'clone', 'vegetative', 'pre-flower', 'flower', 'late-flower', 'harvest-ready', 'harvested']).withMessage('Invalid growth phase'),
  body('planted_date').isISO8601().withMessage('Valid planted date is required'),
  body('room_id').optional().isInt({ min: 1 }).withMessage('Room ID must be a valid integer'),
  body('mother_plant_id').optional().isInt({ min: 1 }).withMessage('Mother plant ID must be a valid integer'),
  body('metrc_tag').optional().trim().isLength({ max: 50 }).withMessage('METRC tag must be less than 50 characters'),
  body('location_code').optional().trim().isLength({ max: 50 }).withMessage('Location code must be less than 50 characters')
];

const updatePlantValidation = [
  body('growth_phase').optional().isIn(['seedling', 'clone', 'vegetative', 'pre-flower', 'flower', 'late-flower', 'harvest-ready', 'harvested']).withMessage('Invalid growth phase'),
  body('room_id').optional().isInt({ min: 1 }).withMessage('Room ID must be a valid integer'),
  body('location_code').optional().trim().isLength({ max: 50 }).withMessage('Location code must be less than 50 characters'),
  body('current_weight').optional().isFloat({ min: 0 }).withMessage('Current weight must be a positive number'),
  body('metrc_tag').optional().trim().isLength({ max: 50 }).withMessage('METRC tag must be less than 50 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

const movePlantValidation = [
  body('new_room_id').isInt({ min: 1 }).withMessage('Valid new room ID is required'),
  body('new_location').optional().trim().isLength({ max: 50 }).withMessage('New location must be less than 50 characters'),
  body('reason').optional().trim().isLength({ max: 255 }).withMessage('Reason must be less than 255 characters')
];

const healthLogValidation = [
  body('observation_type').isIn(['inspection', 'treatment', 'issue', 'recovery', 'phase_change']).withMessage('Invalid observation type'),
  body('health_status').optional().isIn(['healthy', 'sick', 'recovering', 'critical']).withMessage('Invalid health status'),
  body('observations').trim().isLength({ min: 1, max: 1000 }).withMessage('Observations are required and must be less than 1000 characters'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('treatments_applied').optional().isArray().withMessage('Treatments applied must be an array'),
  body('plant_height').optional().isFloat({ min: 0 }).withMessage('Plant height must be a positive number'),
  body('plant_width').optional().isFloat({ min: 0 }).withMessage('Plant width must be a positive number')
];

const harvestValidation = [
  body('harvest_weight').isFloat({ min: 0 }).withMessage('Harvest weight must be a positive number'),
  body('harvest_date').optional().isISO8601().withMessage('Valid harvest date required')
];

// @desc    Get all plants
// @route   GET /api/v1/plants
// @access  Private (plant.view permission)
router.get('/',
  auth,
  requirePermission('plant.view'),
  authorizeFacility,
  logActivity('view_plants'),
  asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      batch_id, 
      room_id, 
      growth_phase, 
      status, 
      is_mother_plant,
      search 
    } = req.query;

    const filters = {
      facility_id: req.user.facilityId
    };

    if (batch_id) filters.batch_id = parseInt(batch_id);
    if (room_id) filters.room_id = parseInt(room_id);
    if (growth_phase) filters.growth_phase = growth_phase;
    if (status) filters.status = status;
    if (is_mother_plant !== undefined) filters.is_mother_plant = is_mother_plant === 'true';

    const options = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      orderBy: 'plants.created_at',
      orderDirection: 'desc'
    };

    const plants = await Plant.findAllWithRelations(filters, options);
    const totalCount = await Plant.count(filters);

    // Filter by search if provided
    let filteredPlants = plants;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlants = plants.filter(plant => 
        plant.plant_tag.toLowerCase().includes(searchLower) ||
        plant.strain_name?.toLowerCase().includes(searchLower) ||
        plant.batch_number?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: {
        plants: filteredPlants.map(plant => ({
          id: plant.id,
          plantTag: plant.plant_tag,
          metrcTag: plant.metrc_tag,
          plantType: plant.plant_type,
          growthPhase: plant.growth_phase,
          status: plant.status,
          strainId: plant.strain_id,
          strainName: plant.strain_name,
          strainType: plant.strain_type,
          batchId: plant.batch_id,
          batchNumber: plant.batch_number,
          batchName: plant.batch_name,
          roomId: plant.room_id,
          roomName: plant.room_name,
          roomType: plant.room_type,
          locationCode: plant.location_code,
          motherPlantId: plant.mother_plant_id,
          isMotherPlant: plant.is_mother_plant,
          plantedDate: plant.planted_date,
          harvestDate: plant.harvest_date,
          currentWeight: plant.current_weight,
          harvestWeight: plant.harvest_weight,
          healthStatus: plant.health_status,
          cultivationData: plant.cultivation_data,
          tags: plant.tags,
          notes: plant.notes,
          createdAt: plant.created_at,
          updatedAt: plant.updated_at
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

// @desc    Get plant by ID
// @route   GET /api/v1/plants/:id
// @access  Private (plant.view permission)
router.get('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  auth,
  requirePermission('plant.view'),
  authorizeFacility,
  logActivity('view_plant'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plant = await Plant.findByIdWithRelations(parseInt(req.params.id));
    
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view this plant');
    }

    res.json({
      success: true,
      data: {
        plant: {
          id: plant.id,
          plantTag: plant.plant_tag,
          metrcTag: plant.metrc_tag,
          plantType: plant.plant_type,
          growthPhase: plant.growth_phase,
          status: plant.status,
          strainId: plant.strain_id,
          strainName: plant.strain_name,
          strainType: plant.strain_type,
          batchId: plant.batch_id,
          batchNumber: plant.batch_number,
          batchName: plant.batch_name,
          roomId: plant.room_id,
          roomName: plant.room_name,
          roomType: plant.room_type,
          locationCode: plant.location_code,
          motherPlantId: plant.mother_plant_id,
          isMotherPlant: plant.is_mother_plant,
          plantedDate: plant.planted_date,
          harvestDate: plant.harvest_date,
          currentWeight: plant.current_weight,
          harvestWeight: plant.harvest_weight,
          healthStatus: plant.health_status,
          cultivationData: plant.cultivation_data,
          tags: plant.tags,
          notes: plant.notes,
          createdAt: plant.created_at,
          updatedAt: plant.updated_at
        }
      }
    });
  })
);

// @desc    Create new plant
// @route   POST /api/v1/plants
// @access  Private (plant.manage permission)
router.post('/',
  createPlantValidation,
  auth,
  requirePermission('plant.manage'),
  authorizeFacility,
  logActivity('create_plant'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const {
      facility_id,
      strain_id,
      batch_id,
      plant_tag,
      plant_type,
      growth_phase,
      planted_date,
      room_id,
      mother_plant_id,
      metrc_tag,
      location_code
    } = req.body;

    // Ensure user can only create plants in their facility
    if (facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to create plants in this facility');
    }

    // Verify batch exists and belongs to the facility
    const batch = await Batch.findById(batch_id);
    if (!batch || batch.facility_id !== req.user.facilityId) {
      throw new ApiError(400, 'Invalid batch ID or batch does not belong to your facility');
    }

    const plantData = {
      facility_id,
      strain_id,
      batch_id,
      plant_tag,
      plant_type,
      growth_phase,
      planted_date,
      room_id: room_id || null,
      mother_plant_id: mother_plant_id || null,
      metrc_tag: metrc_tag || null,
      location_code: location_code || null,
      is_mother_plant: plant_type === 'mother'
    };

    const newPlant = await Plant.create(plantData);

    // Update batch plant count
    await Batch.db('batches')
      .where('id', batch_id)
      .increment('plant_count', 1);

    authLogger.info('Plant created', {
      plantId: newPlant.id,
      plantTag: newPlant.plant_tag,
      batchId: batch_id,
      createdByUserId: req.user.id,
      createdByUsername: req.user.username,
      facilityId: facility_id
    });

    res.status(201).json({
      success: true,
      message: 'Plant created successfully',
      data: {
        plant: {
          id: newPlant.id,
          plantTag: newPlant.plant_tag,
          metrcTag: newPlant.metrc_tag,
          plantType: newPlant.plant_type,
          growthPhase: newPlant.growth_phase,
          status: newPlant.status,
          facilityId: newPlant.facility_id,
          strainId: newPlant.strain_id,
          batchId: newPlant.batch_id,
          roomId: newPlant.room_id,
          locationCode: newPlant.location_code,
          motherPlantId: newPlant.mother_plant_id,
          isMotherPlant: newPlant.is_mother_plant,
          plantedDate: newPlant.planted_date,
          createdAt: newPlant.created_at
        }
      }
    });
  })
);

// @desc    Update plant
// @route   PUT /api/v1/plants/:id
// @access  Private (plant.update permission)
router.put('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  updatePlantValidation,
  auth,
  requirePermission('plant.update'),
  authorizeFacility,
  logActivity('update_plant'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);
    const { growth_phase, room_id, location_code, current_weight, metrc_tag, notes } = req.body;

    const existingPlant = await Plant.findById(plantId);
    if (!existingPlant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (existingPlant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to update this plant');
    }

    const updateData = {};
    if (growth_phase) updateData.growth_phase = growth_phase;
    if (room_id) updateData.room_id = room_id;
    if (location_code) updateData.location_code = location_code;
    if (current_weight !== undefined) updateData.current_weight = current_weight;
    if (metrc_tag) updateData.metrc_tag = metrc_tag;
    if (notes) updateData.notes = notes;

    const updatedPlant = await Plant.update(plantId, updateData);

    authLogger.info('Plant updated', {
      plantId: plantId,
      plantTag: existingPlant.plant_tag,
      updatedByUserId: req.user.id,
      updatedByUsername: req.user.username,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Plant updated successfully',
      data: {
        plant: {
          id: updatedPlant.id,
          plantTag: updatedPlant.plant_tag,
          growthPhase: updatedPlant.growth_phase,
          roomId: updatedPlant.room_id,
          locationCode: updatedPlant.location_code,
          currentWeight: updatedPlant.current_weight,
          metrcTag: updatedPlant.metrc_tag,
          notes: updatedPlant.notes,
          updatedAt: updatedPlant.updated_at
        }
      }
    });
  })
);

// @desc    Move plant to different room/location
// @route   POST /api/v1/plants/:id/move
// @access  Private (plant.update permission)
router.post('/:id/move',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  movePlantValidation,
  auth,
  requirePermission('plant.update'),
  authorizeFacility,
  logActivity('move_plant'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);
    const { new_room_id, new_location, reason } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to move this plant');
    }

    const updatedPlant = await Plant.movePlant(plantId, new_room_id, new_location, req.user.id, reason);

    authLogger.info('Plant moved', {
      plantId: plantId,
      plantTag: plant.plant_tag,
      fromRoomId: plant.room_id,
      toRoomId: new_room_id,
      fromLocation: plant.location_code,
      toLocation: new_location,
      movedByUserId: req.user.id,
      movedByUsername: req.user.username,
      reason: reason
    });

    res.json({
      success: true,
      message: 'Plant moved successfully',
      data: {
        plant: {
          id: updatedPlant.id,
          plantTag: updatedPlant.plant_tag,
          roomId: updatedPlant.room_id,
          locationCode: updatedPlant.location_code,
          updatedAt: updatedPlant.updated_at
        }
      }
    });
  })
);

// @desc    Update plant growth phase
// @route   POST /api/v1/plants/:id/phase
// @access  Private (plant.update permission)
router.post('/:id/phase',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required'),
    body('new_phase').isIn(['seedling', 'clone', 'vegetative', 'pre-flower', 'flower', 'late-flower', 'harvest-ready', 'harvested']).withMessage('Invalid growth phase')
  ],
  auth,
  requirePermission('plant.update'),
  authorizeFacility,
  logActivity('update_plant_phase'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);
    const { new_phase } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to update this plant');
    }

    const updatedPlant = await Plant.updateGrowthPhase(plantId, new_phase, req.user.id);

    authLogger.info('Plant growth phase updated', {
      plantId: plantId,
      plantTag: plant.plant_tag,
      fromPhase: plant.growth_phase,
      toPhase: new_phase,
      updatedByUserId: req.user.id,
      updatedByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'Plant growth phase updated successfully',
      data: {
        plant: {
          id: updatedPlant.id,
          plantTag: updatedPlant.plant_tag,
          growthPhase: updatedPlant.growth_phase,
          updatedAt: updatedPlant.updated_at
        }
      }
    });
  })
);

// @desc    Log plant health observation
// @route   POST /api/v1/plants/:id/health
// @access  Private (plant.update permission)
router.post('/:id/health',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  healthLogValidation,
  auth,
  requirePermission('plant.update'),
  authorizeFacility,
  logActivity('log_plant_health'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);
    const {
      observation_type,
      health_status,
      observations,
      symptoms,
      treatments_applied,
      plant_height,
      plant_width
    } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to log health for this plant');
    }

    const healthLogData = {
      observation_type,
      health_status: health_status || null,
      observations,
      symptoms: symptoms ? JSON.stringify(symptoms) : null,
      treatments_applied: treatments_applied ? JSON.stringify(treatments_applied) : null,
      plant_height: plant_height || null,
      plant_width: plant_width || null,
      logged_by_user_id: req.user.id
    };

    const healthLog = await Plant.logHealthObservation(plantId, healthLogData);

    authLogger.info('Plant health logged', {
      plantId: plantId,
      plantTag: plant.plant_tag,
      observationType: observation_type,
      healthStatus: health_status,
      loggedByUserId: req.user.id,
      loggedByUsername: req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'Health observation logged successfully',
      data: {
        healthLog: {
          id: healthLog.id,
          plantId: healthLog.plant_id,
          observationType: healthLog.observation_type,
          healthStatus: healthLog.health_status,
          observations: healthLog.observations,
          symptoms: healthLog.symptoms ? JSON.parse(healthLog.symptoms) : [],
          treatmentsApplied: healthLog.treatments_applied ? JSON.parse(healthLog.treatments_applied) : [],
          plantHeight: healthLog.plant_height,
          plantWidth: healthLog.plant_width,
          observedAt: healthLog.observed_at,
          createdAt: healthLog.created_at
        }
      }
    });
  })
);

// @desc    Get plant health history
// @route   GET /api/v1/plants/:id/health
// @access  Private (plant.view permission)
router.get('/:id/health',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  auth,
  requirePermission('plant.view'),
  authorizeFacility,
  logActivity('view_plant_health'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);

    const plant = await Plant.findById(plantId);
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view health for this plant');
    }

    const healthHistory = await Plant.getHealthHistory(plantId);

    res.json({
      success: true,
      data: {
        plantId: plantId,
        plantTag: plant.plant_tag,
        healthHistory: healthHistory.map(log => ({
          id: log.id,
          observationType: log.observation_type,
          healthStatus: log.health_status,
          observations: log.observations,
          symptoms: log.symptoms,
          treatmentsApplied: log.treatments_applied,
          plantHeight: log.plant_height,
          plantWidth: log.plant_width,
          loggedByUsername: log.logged_by_username,
          observedAt: log.observed_at,
          createdAt: log.created_at
        }))
      }
    });
  })
);

// @desc    Get plant movement history
// @route   GET /api/v1/plants/:id/movements
// @access  Private (plant.view permission)
router.get('/:id/movements',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  auth,
  requirePermission('plant.view'),
  authorizeFacility,
  logActivity('view_plant_movements'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);

    const plant = await Plant.findById(plantId);
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view movements for this plant');
    }

    const movementHistory = await Plant.getMovementHistory(plantId);

    res.json({
      success: true,
      data: {
        plantId: plantId,
        plantTag: plant.plant_tag,
        movements: movementHistory.map(movement => ({
          id: movement.id,
          fromRoomId: movement.from_room_id,
          fromRoomName: movement.from_room_name,
          toRoomId: movement.to_room_id,
          toRoomName: movement.to_room_name,
          fromLocation: movement.from_location,
          toLocation: movement.to_location,
          reason: movement.reason,
          movedByUsername: movement.moved_by_username,
          movedAt: movement.moved_at,
          createdAt: movement.created_at
        }))
      }
    });
  })
);

// @desc    Harvest plant
// @route   POST /api/v1/plants/:id/harvest
// @access  Private (plant.manage permission)
router.post('/:id/harvest',
  [param('id').isInt({ min: 1 }).withMessage('Valid plant ID is required')],
  harvestValidation,
  auth,
  requirePermission('plant.manage'),
  authorizeFacility,
  logActivity('harvest_plant'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const plantId = parseInt(req.params.id);
    const { harvest_weight, harvest_date } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      throw new ApiError(404, 'Plant not found');
    }

    // Check facility authorization
    if (plant.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to harvest this plant');
    }

    if (plant.status === 'harvested') {
      throw new ApiError(400, 'Plant has already been harvested');
    }

    const harvestData = {
      harvest_weight,
      harvest_date: harvest_date || new Date()
    };

    const harvestedPlant = await Plant.harvestPlant(plantId, harvestData, req.user.id);

    authLogger.info('Plant harvested', {
      plantId: plantId,
      plantTag: plant.plant_tag,
      harvestWeight: harvest_weight,
      harvestDate: harvestData.harvest_date,
      harvestedByUserId: req.user.id,
      harvestedByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'Plant harvested successfully',
      data: {
        plant: {
          id: harvestedPlant.id,
          plantTag: harvestedPlant.plant_tag,
          status: harvestedPlant.status,
          growthPhase: harvestedPlant.growth_phase,
          harvestWeight: harvestedPlant.harvest_weight,
          harvestDate: harvestedPlant.harvest_date,
          updatedAt: harvestedPlant.updated_at
        }
      }
    });
  })
);

// @desc    Get plants by batch
// @route   GET /api/v1/plants/batch/:batchId
// @access  Private (plant.view permission)
router.get('/batch/:batchId',
  [param('batchId').isInt({ min: 1 }).withMessage('Valid batch ID is required')],
  auth,
  requirePermission('plant.view'),
  authorizeFacility,
  logActivity('view_batch_plants'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const batchId = parseInt(req.params.batchId);

    // Verify batch exists and belongs to user's facility
    const batch = await Batch.findById(batchId);
    if (!batch || batch.facility_id !== req.user.facilityId) {
      throw new ApiError(404, 'Batch not found or not authorized');
    }

    const plants = await Plant.findByBatch(batchId);

    res.json({
      success: true,
      data: {
        batchId: batchId,
        plants: plants.map(plant => ({
          id: plant.id,
          plantTag: plant.plant_tag,
          metrcTag: plant.metrc_tag,
          plantType: plant.plant_type,
          growthPhase: plant.growth_phase,
          status: plant.status,
          roomName: plant.room_name,
          locationCode: plant.location_code,
          isMotherPlant: plant.is_mother_plant,
          currentWeight: plant.current_weight,
          harvestWeight: plant.harvest_weight,
          plantedDate: plant.planted_date,
          harvestDate: plant.harvest_date,
          createdAt: plant.created_at
        }))
      }
    });
  })
);

// @desc    Get mother plants
// @route   GET /api/v1/plants/mothers
// @access  Private (plant.view permission)
router.get('/mothers/list',
  auth,
  requirePermission('plant.view'),
  authorizeFacility,
  logActivity('view_mother_plants'),
  asyncHandler(async (req, res) => {
    const motherPlants = await Plant.findMotherPlants(req.user.facilityId);

    res.json({
      success: true,
      data: {
        motherPlants: motherPlants.map(plant => ({
          id: plant.id,
          plantTag: plant.plant_tag,
          strainName: plant.strain_name,
          strainType: plant.strain_type,
          roomName: plant.room_name,
          locationCode: plant.location_code,
          plantedDate: plant.planted_date,
          currentWeight: plant.current_weight,
          healthStatus: plant.health_status,
          createdAt: plant.created_at
        }))
      }
    });
  })
);

module.exports = router;