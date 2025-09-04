/**
 * Environmental Monitoring Routes
 * Handles environmental data, alerts, and monitoring operations
 */

const express = require('express');
const router = express.Router();
const Environmental = require('../models/Environmental');
const { authenticate, requirePermission, authorizeFacility } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/environmental/rooms/:roomId/data
 * @desc Get environmental data for a specific room
 * @access Private
 */
router.get('/rooms/:roomId/data', requirePermission('view_environmental'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sensor_type, start_date, end_date, limit = 1000 } = req.query;

    // Verify room access
    const room = await req.knex('rooms').where('id', roomId).first();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await authorizeFacility(req, res, room.facility_id);

    const data = await Environmental.getRoomData(
      roomId,
      sensor_type,
      start_date,
      end_date,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    logger.error('Error getting room environmental data:', error);
    res.status(500).json({ error: 'Failed to get environmental data' });
  }
});

/**
 * @route GET /api/environmental/rooms/:roomId/latest
 * @desc Get latest readings for all sensors in a room
 * @access Private
 */
router.get('/rooms/:roomId/latest', requirePermission('view_environmental'), async (req, res) => {
  try {
    const { roomId } = req.params;

    // Verify room access
    const room = await req.knex('rooms').where('id', roomId).first();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await authorizeFacility(req, res, room.facility_id);

    const readings = await Environmental.getLatestRoomReadings(roomId);

    res.json({
      success: true,
      data: readings,
      room_name: room.name
    });
  } catch (error) {
    logger.error('Error getting latest room readings:', error);
    res.status(500).json({ error: 'Failed to get latest readings' });
  }
});

/**
 * @route GET /api/environmental/rooms/:roomId/stats
 * @desc Get environmental statistics for a room
 * @access Private
 */
router.get('/rooms/:roomId/stats', requirePermission('view_environmental'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sensor_type, hours = 24 } = req.query;

    if (!sensor_type) {
      return res.status(400).json({ error: 'sensor_type parameter is required' });
    }

    // Verify room access
    const room = await req.knex('rooms').where('id', roomId).first();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await authorizeFacility(req, res, room.facility_id);

    const stats = await Environmental.getRoomStats(roomId, sensor_type, parseInt(hours));

    res.json({
      success: true,
      data: stats,
      sensor_type: sensor_type,
      hours: parseInt(hours)
    });
  } catch (error) {
    logger.error('Error getting room statistics:', error);
    res.status(500).json({ error: 'Failed to get room statistics' });
  }
});

/**
 * @route GET /api/environmental/rooms/:roomId/trends
 * @desc Get environmental trends for analytics
 * @access Private
 */
router.get('/rooms/:roomId/trends', requirePermission('view_environmental'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sensor_type, days = 7 } = req.query;

    if (!sensor_type) {
      return res.status(400).json({ error: 'sensor_type parameter is required' });
    }

    // Verify room access
    const room = await req.knex('rooms').where('id', roomId).first();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await authorizeFacility(req, res, room.facility_id);

    const trends = await Environmental.getTrends(roomId, sensor_type, parseInt(days));

    res.json({
      success: true,
      data: trends,
      sensor_type: sensor_type,
      days: parseInt(days)
    });
  } catch (error) {
    logger.error('Error getting environmental trends:', error);
    res.status(500).json({ error: 'Failed to get environmental trends' });
  }
});

/**
 * @route GET /api/environmental/facilities/:facilityId/overview
 * @desc Get facility-wide environmental overview
 * @access Private
 */
router.get('/facilities/:facilityId/overview', requirePermission('view_environmental'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    await authorizeFacility(req, res, facilityId);

    const overview = await Environmental.getFacilityOverview(facilityId);

    // Get room names
    const rooms = await req.knex('rooms')
      .select('id', 'name', 'room_type')
      .where('facility_id', facilityId)
      .where('is_active', true);

    const roomsMap = {};
    rooms.forEach(room => {
      roomsMap[room.id] = room;
    });

    // Combine room data with room info
    const enrichedOverview = {};
    Object.keys(overview).forEach(roomId => {
      if (roomsMap[roomId]) {
        enrichedOverview[roomId] = {
          room_info: roomsMap[roomId],
          sensors: overview[roomId]
        };
      }
    });

    res.json({
      success: true,
      data: enrichedOverview
    });
  } catch (error) {
    logger.error('Error getting facility environmental overview:', error);
    res.status(500).json({ error: 'Failed to get facility overview' });
  }
});

/**
 * @route POST /api/environmental/data
 * @desc Record environmental data point
 * @access Private
 */
router.post('/data', requirePermission('manage_environmental'), async (req, res) => {
  try {
    const { room_id, sensor_data } = req.body;

    if (!room_id || !sensor_data) {
      return res.status(400).json({ error: 'room_id and sensor_data are required' });
    }

    // Verify room access
    const room = await req.knex('rooms').where('id', room_id).first();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await authorizeFacility(req, res, room.facility_id);

    // Validate sensor data
    const requiredFields = ['sensor_type', 'value', 'unit'];
    for (const field of requiredFields) {
      if (sensor_data[field] === undefined) {
        return res.status(400).json({ error: `sensor_data.${field} is required` });
      }
    }

    const dataPoint = await Environmental.recordData(
      room.facility_id,
      room_id,
      sensor_data,
      req.user.id
    );

    logger.info(`Environmental data recorded: ${sensor_data.sensor_type} = ${sensor_data.value}${sensor_data.unit} in room ${room.name}`, {
      userId: req.user.id,
      roomId: room_id,
      sensorType: sensor_data.sensor_type
    });

    res.status(201).json({
      success: true,
      data: dataPoint
    });
  } catch (error) {
    logger.error('Error recording environmental data:', error);
    res.status(500).json({ error: 'Failed to record environmental data' });
  }
});

/**
 * @route POST /api/environmental/data/bulk
 * @desc Bulk insert environmental data (for integrations)
 * @access Private
 */
router.post('/data/bulk', requirePermission('manage_environmental'), async (req, res) => {
  try {
    const { data_points } = req.body;

    if (!Array.isArray(data_points) || data_points.length === 0) {
      return res.status(400).json({ error: 'data_points array is required' });
    }

    // Validate all data points and check room access
    const roomIds = [...new Set(data_points.map(dp => dp.room_id))];
    const rooms = await req.knex('rooms').whereIn('id', roomIds);
    
    if (rooms.length !== roomIds.length) {
      return res.status(404).json({ error: 'One or more rooms not found' });
    }

    // Check facility access for all rooms
    const facilityIds = [...new Set(rooms.map(r => r.facility_id))];
    for (const facilityId of facilityIds) {
      await authorizeFacility(req, res, facilityId);
    }

    // Validate data points
    const requiredFields = ['room_id', 'facility_id', 'sensor_type', 'value', 'unit'];
    for (const dataPoint of data_points) {
      for (const field of requiredFields) {
        if (dataPoint[field] === undefined) {
          return res.status(400).json({ error: `${field} is required for all data points` });
        }
      }
    }

    const results = await Environmental.bulkInsertData(data_points);

    logger.info(`Bulk environmental data inserted: ${results.length} data points`, {
      userId: req.user.id,
      dataPointCount: results.length
    });

    res.status(201).json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error('Error bulk inserting environmental data:', error);
    res.status(500).json({ error: 'Failed to bulk insert environmental data' });
  }
});

/**
 * @route GET /api/environmental/alerts
 * @desc Get active alerts for facility
 * @access Private
 */
router.get('/alerts', requirePermission('view_alerts'), async (req, res) => {
  try {
    const { facility_id, room_id } = req.query;

    if (!facility_id) {
      return res.status(400).json({ error: 'facility_id parameter is required' });
    }

    await authorizeFacility(req, res, facility_id);

    const alerts = await Environmental.getActiveAlerts(facility_id, room_id);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    logger.error('Error getting environmental alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * @route PUT /api/environmental/alerts/:alertId/acknowledge
 * @desc Acknowledge an alert
 * @access Private
 */
router.put('/alerts/:alertId/acknowledge', requirePermission('manage_alerts'), async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    // Verify alert exists and user has access
    const alert = await req.knex('alerts').where('id', alertId).first();
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await authorizeFacility(req, res, alert.facility_id);

    const updatedAlert = await Environmental.acknowledgeAlert(alertId, req.user.id, notes);

    logger.info(`Alert acknowledged: ${alertId}`, {
      userId: req.user.id,
      alertId: alertId
    });

    res.json({
      success: true,
      data: updatedAlert
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * @route PUT /api/environmental/alerts/:alertId/resolve
 * @desc Resolve an alert
 * @access Private
 */
router.put('/alerts/:alertId/resolve', requirePermission('manage_alerts'), async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    // Verify alert exists and user has access
    const alert = await req.knex('alerts').where('id', alertId).first();
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await authorizeFacility(req, res, alert.facility_id);

    const updatedAlert = await Environmental.resolveAlert(alertId, req.user.id, notes);

    logger.info(`Alert resolved: ${alertId}`, {
      userId: req.user.id,
      alertId: alertId
    });

    res.json({
      success: true,
      data: updatedAlert
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * @route GET /api/environmental/sensor-types
 * @desc Get available sensor types
 * @access Private
 */
router.get('/sensor-types', requirePermission('view_environmental'), async (req, res) => {
  try {
    const sensorTypes = [
      { type: 'temperature', unit: '°F', name: 'Temperature' },
      { type: 'humidity', unit: '%', name: 'Humidity' },
      { type: 'co2', unit: 'ppm', name: 'CO2' },
      { type: 'ph', unit: 'pH', name: 'pH Level' },
      { type: 'ec', unit: 'µS/cm', name: 'Electrical Conductivity' },
      { type: 'tds', unit: 'ppm', name: 'Total Dissolved Solids' },
      { type: 'light_intensity', unit: 'µmol/m²/s', name: 'Light Intensity' },
      { type: 'vpd', unit: 'kPa', name: 'Vapor Pressure Deficit' },
      { type: 'water_temperature', unit: '°F', name: 'Water Temperature' },
      { type: 'air_flow', unit: 'CFM', name: 'Air Flow' },
      { type: 'pressure', unit: 'PSI', name: 'Pressure' }
    ];

    res.json({
      success: true,
      data: sensorTypes
    });
  } catch (error) {
    logger.error('Error getting sensor types:', error);
    res.status(500).json({ error: 'Failed to get sensor types' });
  }
});

module.exports = router;