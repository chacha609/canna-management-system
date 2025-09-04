const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility, logActivity } = require('../middleware/auth');
const { User } = require('../models');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const createRoomValidation = [
  body('facility_id').isInt({ min: 1 }).withMessage('Valid facility ID is required'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Room name is required and must be less than 100 characters'),
  body('room_type').isIn(['veg', 'flower', 'mother', 'clone', 'drying', 'curing', 'processing', 'storage', 'quarantine']).withMessage('Invalid room type'),
  body('room_code').optional().trim().isLength({ max: 20 }).withMessage('Room code must be less than 20 characters'),
  body('length').optional().isFloat({ min: 0 }).withMessage('Length must be a positive number'),
  body('width').optional().isFloat({ min: 0 }).withMessage('Width must be a positive number'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('max_capacity').optional().isInt({ min: 0 }).withMessage('Max capacity must be a non-negative integer'),
  body('environmental_settings').optional().isObject().withMessage('Environmental settings must be an object'),
  body('equipment_list').optional().isArray().withMessage('Equipment list must be an array'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

const updateRoomValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Room name must be less than 100 characters'),
  body('room_type').optional().isIn(['veg', 'flower', 'mother', 'clone', 'drying', 'curing', 'processing', 'storage', 'quarantine']).withMessage('Invalid room type'),
  body('room_code').optional().trim().isLength({ max: 20 }).withMessage('Room code must be less than 20 characters'),
  body('length').optional().isFloat({ min: 0 }).withMessage('Length must be a positive number'),
  body('width').optional().isFloat({ min: 0 }).withMessage('Width must be a positive number'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('max_capacity').optional().isInt({ min: 0 }).withMessage('Max capacity must be a non-negative integer'),
  body('environmental_settings').optional().isObject().withMessage('Environmental settings must be an object'),
  body('equipment_list').optional().isArray().withMessage('Equipment list must be an array'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

// @desc    Get all rooms
// @route   GET /api/v1/rooms
// @access  Private (room.view permission)
router.get('/',
  auth,
  requirePermission('room.view'),
  authorizeFacility,
  logActivity('view_rooms'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, room_type, is_active = true, search } = req.query;

    let query = User.db('rooms')
      .select('*')
      .where('facility_id', req.user.facilityId);

    if (is_active !== 'all') {
      query = query.where('is_active', is_active === 'true');
    }

    if (room_type) {
      query = query.where('room_type', room_type);
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('room_code', 'ilike', `%${search}%`);
      });
    }

    // Get total count
    const totalCount = await query.clone().count('* as count').first();

    // Apply pagination and ordering
    const rooms = await query
      .orderBy('name', 'asc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        rooms: rooms.map(room => ({
          id: room.id,
          name: room.name,
          roomType: room.room_type,
          roomCode: room.room_code,
          length: room.length,
          width: room.width,
          height: room.height,
          maxCapacity: room.max_capacity,
          currentCapacity: room.current_capacity,
          environmentalSettings: room.environmental_settings ? JSON.parse(room.environmental_settings) : {},
          equipmentList: room.equipment_list ? JSON.parse(room.equipment_list) : [],
          notes: room.notes,
          isActive: room.is_active,
          createdAt: room.created_at,
          updatedAt: room.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount.count),
          pages: Math.ceil(parseInt(totalCount.count) / parseInt(limit))
        }
      }
    });
  })
);

// @desc    Get room by ID
// @route   GET /api/v1/rooms/:id
// @access  Private (room.view permission)
router.get('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid room ID is required')],
  auth,
  requirePermission('room.view'),
  authorizeFacility,
  logActivity('view_room'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const room = await User.db('rooms')
      .where('id', parseInt(req.params.id))
      .where('facility_id', req.user.facilityId)
      .first();

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          roomType: room.room_type,
          roomCode: room.room_code,
          length: room.length,
          width: room.width,
          height: room.height,
          maxCapacity: room.max_capacity,
          currentCapacity: room.current_capacity,
          environmentalSettings: room.environmental_settings ? JSON.parse(room.environmental_settings) : {},
          equipmentList: room.equipment_list ? JSON.parse(room.equipment_list) : [],
          notes: room.notes,
          isActive: room.is_active,
          createdAt: room.created_at,
          updatedAt: room.updated_at
        }
      }
    });
  })
);

// @desc    Create new room
// @route   POST /api/v1/rooms
// @access  Private (room.manage permission)
router.post('/',
  createRoomValidation,
  auth,
  requirePermission('room.manage'),
  authorizeFacility,
  logActivity('create_room'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const {
      facility_id,
      name,
      room_type,
      room_code,
      length,
      width,
      height,
      max_capacity,
      environmental_settings,
      equipment_list,
      notes
    } = req.body;

    // Ensure user can only create rooms in their facility
    if (facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to create rooms in this facility');
    }

    // Check if room name already exists in facility
    const existingRoom = await User.db('rooms')
      .where('facility_id', facility_id)
      .where('name', name)
      .first();

    if (existingRoom) {
      throw new ApiError(400, 'Room with this name already exists in your facility');
    }

    // Check if room code already exists in facility (if provided)
    if (room_code) {
      const existingCode = await User.db('rooms')
        .where('facility_id', facility_id)
        .where('room_code', room_code)
        .first();

      if (existingCode) {
        throw new ApiError(400, 'Room with this code already exists in your facility');
      }
    }

    const roomData = {
      facility_id,
      name,
      room_type,
      room_code: room_code || null,
      length: length || null,
      width: width || null,
      height: height || null,
      max_capacity: max_capacity || null,
      current_capacity: 0,
      environmental_settings: environmental_settings ? JSON.stringify(environmental_settings) : null,
      equipment_list: equipment_list ? JSON.stringify(equipment_list) : null,
      notes: notes || null,
      is_active: true
    };

    const [newRoom] = await User.db('rooms').insert(roomData).returning('*');

    authLogger.info('Room created', {
      roomId: newRoom.id,
      roomName: newRoom.name,
      roomType: newRoom.room_type,
      createdByUserId: req.user.id,
      createdByUsername: req.user.username,
      facilityId: facility_id
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        room: {
          id: newRoom.id,
          name: newRoom.name,
          roomType: newRoom.room_type,
          roomCode: newRoom.room_code,
          length: newRoom.length,
          width: newRoom.width,
          height: newRoom.height,
          maxCapacity: newRoom.max_capacity,
          currentCapacity: newRoom.current_capacity,
          environmentalSettings: newRoom.environmental_settings ? JSON.parse(newRoom.environmental_settings) : {},
          equipmentList: newRoom.equipment_list ? JSON.parse(newRoom.equipment_list) : [],
          notes: newRoom.notes,
          isActive: newRoom.is_active,
          createdAt: newRoom.created_at
        }
      }
    });
  })
);

// @desc    Update room
// @route   PUT /api/v1/rooms/:id
// @access  Private (room.manage permission)
router.put('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid room ID is required')],
  updateRoomValidation,
  auth,
  requirePermission('room.manage'),
  authorizeFacility,
  logActivity('update_room'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const roomId = parseInt(req.params.id);
    const {
      name,
      room_type,
      room_code,
      length,
      width,
      height,
      max_capacity,
      environmental_settings,
      equipment_list,
      notes
    } = req.body;

    const existingRoom = await User.db('rooms')
      .where('id', roomId)
      .where('facility_id', req.user.facilityId)
      .first();

    if (!existingRoom) {
      throw new ApiError(404, 'Room not found');
    }

    // Check if new name conflicts with existing room
    if (name && name !== existingRoom.name) {
      const nameConflict = await User.db('rooms')
        .where('facility_id', req.user.facilityId)
        .where('name', name)
        .whereNot('id', roomId)
        .first();

      if (nameConflict) {
        throw new ApiError(400, 'Room with this name already exists in your facility');
      }
    }

    // Check if new room code conflicts with existing room
    if (room_code && room_code !== existingRoom.room_code) {
      const codeConflict = await User.db('rooms')
        .where('facility_id', req.user.facilityId)
        .where('room_code', room_code)
        .whereNot('id', roomId)
        .first();

      if (codeConflict) {
        throw new ApiError(400, 'Room with this code already exists in your facility');
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (name) updateData.name = name;
    if (room_type) updateData.room_type = room_type;
    if (room_code !== undefined) updateData.room_code = room_code;
    if (length !== undefined) updateData.length = length;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (max_capacity !== undefined) updateData.max_capacity = max_capacity;
    if (environmental_settings) updateData.environmental_settings = JSON.stringify(environmental_settings);
    if (equipment_list) updateData.equipment_list = JSON.stringify(equipment_list);
    if (notes !== undefined) updateData.notes = notes;

    const [updatedRoom] = await User.db('rooms')
      .where('id', roomId)
      .update(updateData)
      .returning('*');

    authLogger.info('Room updated', {
      roomId: roomId,
      roomName: existingRoom.name,
      updatedByUserId: req.user.id,
      updatedByUsername: req.user.username,
      changes: Object.keys(updateData).filter(key => key !== 'updated_at')
    });

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: {
        room: {
          id: updatedRoom.id,
          name: updatedRoom.name,
          roomType: updatedRoom.room_type,
          roomCode: updatedRoom.room_code,
          length: updatedRoom.length,
          width: updatedRoom.width,
          height: updatedRoom.height,
          maxCapacity: updatedRoom.max_capacity,
          currentCapacity: updatedRoom.current_capacity,
          environmentalSettings: updatedRoom.environmental_settings ? JSON.parse(updatedRoom.environmental_settings) : {},
          equipmentList: updatedRoom.equipment_list ? JSON.parse(updatedRoom.equipment_list) : [],
          notes: updatedRoom.notes,
          isActive: updatedRoom.is_active,
          updatedAt: updatedRoom.updated_at
        }
      }
    });
  })
);

// @desc    Deactivate room
// @route   DELETE /api/v1/rooms/:id
// @access  Private (room.manage permission)
router.delete('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid room ID is required')],
  auth,
  requirePermission('room.manage'),
  authorizeFacility,
  logActivity('deactivate_room'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const roomId = parseInt(req.params.id);

    const existingRoom = await User.db('rooms')
      .where('id', roomId)
      .where('facility_id', req.user.facilityId)
      .first();

    if (!existingRoom) {
      throw new ApiError(404, 'Room not found');
    }

    // Check if room has active plants
    const activePlants = await User.db('plants')
      .where('room_id', roomId)
      .where('status', 'active')
      .count('* as count')
      .first();

    if (parseInt(activePlants.count) > 0) {
      throw new ApiError(400, 'Cannot deactivate room that contains active plants');
    }

    await User.db('rooms')
      .where('id', roomId)
      .update({ 
        is_active: false, 
        updated_at: new Date() 
      });

    authLogger.info('Room deactivated', {
      roomId: roomId,
      roomName: existingRoom.name,
      deactivatedByUserId: req.user.id,
      deactivatedByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'Room deactivated successfully'
    });
  })
);

// @desc    Get room statistics
// @route   GET /api/v1/rooms/:id/stats
// @access  Private (room.view permission)
router.get('/:id/stats',
  [param('id').isInt({ min: 1 }).withMessage('Valid room ID is required')],
  auth,
  requirePermission('room.view'),
  authorizeFacility,
  logActivity('view_room_stats'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const roomId = parseInt(req.params.id);

    const room = await User.db('rooms')
      .where('id', roomId)
      .where('facility_id', req.user.facilityId)
      .first();

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Get plant counts by status
    const plantStats = await User.db('plants')
      .select('status')
      .count('* as count')
      .where('room_id', roomId)
      .groupBy('status');

    // Get plant counts by growth phase
    const phaseStats = await User.db('plants')
      .select('growth_phase')
      .count('* as count')
      .where('room_id', roomId)
      .groupBy('growth_phase');

    // Get batch counts
    const batchStats = await User.db('batches')
      .select('status')
      .count('* as count')
      .where('room_id', roomId)
      .groupBy('status');

    // Calculate capacity utilization
    const totalPlants = await User.db('plants')
      .where('room_id', roomId)
      .where('status', 'active')
      .count('* as count')
      .first();

    const capacityUtilization = room.max_capacity 
      ? (parseInt(totalPlants.count) / room.max_capacity * 100).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        roomId: roomId,
        roomName: room.name,
        roomType: room.room_type,
        maxCapacity: room.max_capacity,
        currentCapacity: parseInt(totalPlants.count),
        capacityUtilization: capacityUtilization ? parseFloat(capacityUtilization) : null,
        plantStats: plantStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        phaseStats: phaseStats.reduce((acc, stat) => {
          acc[stat.growth_phase] = parseInt(stat.count);
          return acc;
        }, {}),
        batchStats: batchStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {})
      }
    });
  })
);

// @desc    Get rooms by type
// @route   GET /api/v1/rooms/type/:roomType
// @access  Private (room.view permission)
router.get('/type/:roomType',
  [param('roomType').isIn(['veg', 'flower', 'mother', 'clone', 'drying', 'curing', 'processing', 'storage', 'quarantine']).withMessage('Invalid room type')],
  auth,
  requirePermission('room.view'),
  authorizeFacility,
  logActivity('view_rooms_by_type'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const roomType = req.params.roomType;
    const { is_active = true } = req.query;

    let query = User.db('rooms')
      .select('*')
      .where('facility_id', req.user.facilityId)
      .where('room_type', roomType);

    if (is_active !== 'all') {
      query = query.where('is_active', is_active === 'true');
    }

    const rooms = await query.orderBy('name', 'asc');

    res.json({
      success: true,
      data: {
        roomType: roomType,
        rooms: rooms.map(room => ({
          id: room.id,
          name: room.name,
          roomCode: room.room_code,
          maxCapacity: room.max_capacity,
          currentCapacity: room.current_capacity,
          environmentalSettings: room.environmental_settings ? JSON.parse(room.environmental_settings) : {},
          isActive: room.is_active,
          createdAt: room.created_at
        }))
      }
    });
  })
);

module.exports = router;