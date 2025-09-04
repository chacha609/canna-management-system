/**
 * Processing Routes
 * Handles post-harvest processing operations including drying, curing, trimming, and extraction
 */

const express = require('express');
const router = express.Router();
const Processing = require('../models/Processing');
const { authenticate, requirePermission, authorizeFacility } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/processing/types
 * @desc Get available processing types
 * @access Private
 */
router.get('/types', requirePermission('view_processing'), async (req, res) => {
  try {
    const types = Processing.getProcessingTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Error getting processing types:', error);
    res.status(500).json({ error: 'Failed to get processing types' });
  }
});

/**
 * @route GET /api/processing/status-options
 * @desc Get processing status options
 * @access Private
 */
router.get('/status-options', requirePermission('view_processing'), async (req, res) => {
  try {
    const statusOptions = Processing.getStatusOptions();
    res.json({
      success: true,
      data: statusOptions
    });
  } catch (error) {
    logger.error('Error getting status options:', error);
    res.status(500).json({ error: 'Failed to get status options' });
  }
});

/**
 * @route GET /api/processing/facilities/:facilityId/batches
 * @desc Get processing batches for facility
 * @access Private
 */
router.get('/facilities/:facilityId/batches', requirePermission('view_processing'), async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { processing_type, status, room_id, start_date, end_date, limit = 50 } = req.query;

    await authorizeFacility(req, res, facilityId);

    const filters = {};
    if (processing_type) filters.processing_type = processing_type;
    if (status) filters.status = status;
    if (room_id) filters.room_id = room_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const batches = await Processing.getFacilityBatches(facilityId, filters);

    res.json({
      success: true,
      data: batches.slice(0, parseInt(limit)),
      count: batches.length
    });
  } catch (error) {
    logger.error('Error getting facility processing batches:', error);
    res.status(500).json({ error: 'Failed to get processing batches' });
  }
});

/**
 * @route GET /api/processing/batches/:batchId
 * @desc Get processing batch details
 * @access Private
 */
router.get('/batches/:batchId', requirePermission('view_processing'), async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Processing.getBatchDetails(batchId);
    
    // Verify facility access
    await authorizeFacility(req, res, batch.facility_id);

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    logger.error('Error getting processing batch details:', error);
    res.status(500).json({ error: 'Failed to get processing batch details' });
  }
});

/**
 * @route POST /api/processing/batches
 * @desc Create new processing batch
 * @access Private
 */
router.post('/batches', requirePermission('manage_processing'), async (req, res) => {
  try {
    const {
      facility_id,
      source_batch_id,
      room_id,
      processing_type,
      input_weight,
      moisture_content_start,
      moisture_content_target,
      expected_completion_date,
      processing_parameters,
      quality_metrics,
      tags,
      notes
    } = req.body;

    // Validate required fields
    if (!facility_id || !source_batch_id || !processing_type || !input_weight) {
      return res.status(400).json({ 
        error: 'facility_id, source_batch_id, processing_type, and input_weight are required' 
      });
    }

    await authorizeFacility(req, res, facility_id);

    // Verify source batch exists
    const sourceBatch = await req.knex('batches').where('id', source_batch_id).first();
    if (!sourceBatch) {
      return res.status(404).json({ error: 'Source batch not found' });
    }

    // Verify room exists if provided
    if (room_id) {
      const room = await req.knex('rooms').where('id', room_id).where('facility_id', facility_id).first();
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
    }

    const batchData = {
      source_batch_id,
      room_id,
      processing_type,
      input_weight: parseFloat(input_weight),
      moisture_content_start: moisture_content_start ? parseFloat(moisture_content_start) : null,
      moisture_content_target: moisture_content_target ? parseFloat(moisture_content_target) : null,
      expected_completion_date,
      processing_parameters: processing_parameters || {},
      quality_metrics: quality_metrics || {},
      tags: tags || [],
      notes
    };

    const processingBatch = await Processing.createBatch(facility_id, batchData, req.user.id);

    logger.info(`Processing batch created: ${processingBatch.processing_batch_number}`, {
      userId: req.user.id,
      facilityId: facility_id,
      processingType: processing_type,
      batchId: processingBatch.id
    });

    res.status(201).json({
      success: true,
      data: processingBatch
    });
  } catch (error) {
    logger.error('Error creating processing batch:', error);
    res.status(500).json({ error: 'Failed to create processing batch' });
  }
});

/**
 * @route PUT /api/processing/batches/:batchId/progress
 * @desc Update processing batch progress
 * @access Private
 */
router.put('/batches/:batchId/progress', requirePermission('manage_processing'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const {
      current_weight,
      moisture_content_current,
      processing_parameters,
      quality_metrics,
      notes
    } = req.body;

    // Validate required fields
    if (!current_weight) {
      return res.status(400).json({ error: 'current_weight is required' });
    }

    // Get batch to verify facility access
    const batch = await req.knex('processing_batches').where('id', batchId).first();
    if (!batch) {
      return res.status(404).json({ error: 'Processing batch not found' });
    }

    await authorizeFacility(req, res, batch.facility_id);

    const updateData = {
      current_weight: parseFloat(current_weight),
      moisture_content_current: moisture_content_current ? parseFloat(moisture_content_current) : null,
      processing_parameters,
      quality_metrics,
      notes
    };

    const updatedBatch = await Processing.updateProgress(batchId, updateData, req.user.id);

    logger.info(`Processing batch progress updated: ${batch.processing_batch_number}`, {
      userId: req.user.id,
      batchId: batchId,
      currentWeight: current_weight
    });

    res.json({
      success: true,
      data: updatedBatch
    });
  } catch (error) {
    logger.error('Error updating processing batch progress:', error);
    res.status(500).json({ error: 'Failed to update processing batch progress' });
  }
});

/**
 * @route PUT /api/processing/batches/:batchId/complete
 * @desc Complete processing batch
 * @access Private
 */
router.put('/batches/:batchId/complete', requirePermission('manage_processing'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const {
      output_weight,
      waste_weight,
      disposal_method,
      waste_notes,
      quality_metrics,
      notes
    } = req.body;

    // Validate required fields
    if (!output_weight) {
      return res.status(400).json({ error: 'output_weight is required' });
    }

    // Get batch to verify facility access
    const batch = await req.knex('processing_batches').where('id', batchId).first();
    if (!batch) {
      return res.status(404).json({ error: 'Processing batch not found' });
    }

    if (batch.status === 'completed') {
      return res.status(400).json({ error: 'Processing batch is already completed' });
    }

    await authorizeFacility(req, res, batch.facility_id);

    const completionData = {
      output_weight: parseFloat(output_weight),
      waste_weight: waste_weight ? parseFloat(waste_weight) : 0,
      disposal_method,
      waste_notes,
      quality_metrics,
      notes
    };

    const updatedBatch = await Processing.completeBatch(batchId, completionData, req.user.id);

    logger.info(`Processing batch completed: ${batch.processing_batch_number}`, {
      userId: req.user.id,
      batchId: batchId,
      outputWeight: output_weight,
      wasteWeight: waste_weight
    });

    res.json({
      success: true,
      data: updatedBatch
    });
  } catch (error) {
    logger.error('Error completing processing batch:', error);
    res.status(500).json({ error: 'Failed to complete processing batch' });
  }
});

/**
 * @route PUT /api/processing/batches/:batchId/status
 * @desc Update processing batch status
 * @access Private
 */
router.put('/batches/:batchId/status', requirePermission('manage_processing'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['in_progress', 'completed', 'on_hold', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get batch to verify facility access
    const batch = await req.knex('processing_batches').where('id', batchId).first();
    if (!batch) {
      return res.status(404).json({ error: 'Processing batch not found' });
    }

    await authorizeFacility(req, res, batch.facility_id);

    const updatedBatch = await req.knex('processing_batches')
      .where('id', batchId)
      .update({
        status: status,
        notes: notes || batch.notes,
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Processing batch status updated: ${batch.processing_batch_number} -> ${status}`, {
      userId: req.user.id,
      batchId: batchId,
      oldStatus: batch.status,
      newStatus: status
    });

    res.json({
      success: true,
      data: updatedBatch[0]
    });
  } catch (error) {
    logger.error('Error updating processing batch status:', error);
    res.status(500).json({ error: 'Failed to update processing batch status' });
  }
});

/**
 * @route GET /api/processing/facilities/:facilityId/stats
 * @desc Get processing statistics for facility
 * @access Private
 */
router.get('/facilities/:facilityId/stats', requirePermission('view_processing'), async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { time_range = 30 } = req.query;

    await authorizeFacility(req, res, facilityId);

    const stats = await Processing.getProcessingStats(facilityId, parseInt(time_range));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting processing statistics:', error);
    res.status(500).json({ error: 'Failed to get processing statistics' });
  }
});

/**
 * @route DELETE /api/processing/batches/:batchId
 * @desc Delete processing batch (soft delete)
 * @access Private
 */
router.delete('/batches/:batchId', requirePermission('manage_processing'), async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get batch to verify facility access
    const batch = await req.knex('processing_batches').where('id', batchId).first();
    if (!batch) {
      return res.status(404).json({ error: 'Processing batch not found' });
    }

    await authorizeFacility(req, res, batch.facility_id);

    // Only allow deletion of batches that haven't been completed
    if (batch.status === 'completed') {
      return res.status(400).json({ error: 'Cannot delete completed processing batch' });
    }

    // Soft delete by updating status
    await req.knex('processing_batches')
      .where('id', batchId)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });

    logger.info(`Processing batch deleted: ${batch.processing_batch_number}`, {
      userId: req.user.id,
      batchId: batchId
    });

    res.json({
      success: true,
      message: 'Processing batch deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting processing batch:', error);
    res.status(500).json({ error: 'Failed to delete processing batch' });
  }
});

/**
 * @route GET /api/processing/facilities/:facilityId/rooms
 * @desc Get processing rooms for facility
 * @access Private
 */
router.get('/facilities/:facilityId/rooms', requirePermission('view_processing'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    await authorizeFacility(req, res, facilityId);

    const rooms = await req.knex('rooms')
      .where('facility_id', facilityId)
      .whereIn('room_type', ['drying', 'curing', 'processing'])
      .where('is_active', true)
      .select('id', 'name', 'room_type', 'room_code', 'capacity')
      .orderBy('name');

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    logger.error('Error getting processing rooms:', error);
    res.status(500).json({ error: 'Failed to get processing rooms' });
  }
});

/**
 * @route GET /api/processing/facilities/:facilityId/source-batches
 * @desc Get available source batches for processing
 * @access Private
 */
router.get('/facilities/:facilityId/source-batches', requirePermission('view_processing'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    await authorizeFacility(req, res, facilityId);

    const batches = await req.knex('batches')
      .leftJoin('strains', 'batches.strain_id', 'strains.id')
      .where('batches.facility_id', facilityId)
      .where('batches.status', 'harvested')
      .select(
        'batches.id',
        'batches.batch_number',
        'batches.harvest_date',
        'batches.harvest_weight',
        'strains.name as strain_name'
      )
      .orderBy('batches.harvest_date', 'desc');

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    logger.error('Error getting source batches:', error);
    res.status(500).json({ error: 'Failed to get source batches' });
  }
});

module.exports = router;