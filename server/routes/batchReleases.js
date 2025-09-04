/**
 * Batch Release Routes
 * Handles batch release workflows, quality control checkpoints, and approval systems
 */

const express = require('express');
const router = express.Router();
const BatchRelease = require('../models/BatchRelease');
const { authenticate, requirePermission, authorizeFacility } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/batch-releases/status-options
 * @desc Get batch release status options
 * @access Private
 */
router.get('/status-options', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const statusOptions = BatchRelease.getStatusOptions();
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
 * @route GET /api/batch-releases/facilities/:facilityId/releases
 * @desc Get batch releases for facility
 * @access Private
 */
router.get('/facilities/:facilityId/releases', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { status, product_type, processing_type, start_date, end_date, limit = 50 } = req.query;

    await authorizeFacility(req, res, facilityId);

    const filters = {};
    if (status) filters.status = status;
    if (product_type) filters.product_type = product_type;
    if (processing_type) filters.processing_type = processing_type;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const releases = await BatchRelease.getFacilityReleases(facilityId, filters);

    res.json({
      success: true,
      data: releases.slice(0, parseInt(limit)),
      count: releases.length
    });
  } catch (error) {
    logger.error('Error getting facility batch releases:', error);
    res.status(500).json({ error: 'Failed to get batch releases' });
  }
});

/**
 * @route GET /api/batch-releases/:releaseId
 * @desc Get batch release details
 * @access Private
 */
router.get('/:releaseId', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const { releaseId } = req.params;

    const release = await BatchRelease.getReleaseDetails(releaseId);
    
    // Verify facility access
    await authorizeFacility(req, res, release.facility_id);

    res.json({
      success: true,
      data: release
    });
  } catch (error) {
    logger.error('Error getting batch release details:', error);
    res.status(500).json({ error: 'Failed to get batch release details' });
  }
});

/**
 * @route POST /api/batch-releases
 * @desc Create new batch release workflow
 * @access Private
 */
router.post('/', requirePermission('manage_quality_assurance'), async (req, res) => {
  try {
    const {
      facility_id,
      processing_batch_id,
      template_id,
      target_completion_date,
      notes
    } = req.body;

    // Validate required fields
    if (!facility_id || !processing_batch_id || !template_id) {
      return res.status(400).json({ 
        error: 'facility_id, processing_batch_id, and template_id are required' 
      });
    }

    await authorizeFacility(req, res, facility_id);

    // Verify processing batch exists and is completed
    const processingBatch = await req.knex('processing_batches')
      .where('id', processing_batch_id)
      .where('facility_id', facility_id)
      .first();

    if (!processingBatch) {
      return res.status(404).json({ error: 'Processing batch not found' });
    }

    if (processingBatch.status !== 'completed') {
      return res.status(400).json({ error: 'Processing batch must be completed before release workflow can be initiated' });
    }

    // Check if release already exists for this processing batch
    const existingRelease = await req.knex('batch_releases')
      .where('processing_batch_id', processing_batch_id)
      .first();

    if (existingRelease) {
      return res.status(400).json({ error: 'Release workflow already exists for this processing batch' });
    }

    // Verify template exists
    const template = await req.knex('batch_release_templates')
      .where('id', template_id)
      .where('facility_id', facility_id)
      .first();

    if (!template) {
      return res.status(404).json({ error: 'Release template not found' });
    }

    const releaseData = {
      processing_batch_id,
      template_id,
      target_completion_date,
      notes
    };

    const release = await BatchRelease.createRelease(facility_id, releaseData, req.user.id);

    logger.info(`Batch release created: ${release.release_number}`, {
      userId: req.user.id,
      facilityId: facility_id,
      releaseId: release.id,
      processingBatchId: processing_batch_id
    });

    res.status(201).json({
      success: true,
      data: release
    });
  } catch (error) {
    logger.error('Error creating batch release:', error);
    res.status(500).json({ error: 'Failed to create batch release' });
  }
});

/**
 * @route PUT /api/batch-releases/:releaseId/checkpoints/:checkpointId/complete
 * @desc Complete a quality control checkpoint
 * @access Private
 */
router.put('/:releaseId/checkpoints/:checkpointId/complete', requirePermission('manage_quality_assurance'), async (req, res) => {
  try {
    const { releaseId, checkpointId } = req.params;
    const {
      passed,
      data,
      photos,
      notes,
      failure_reason,
      corrective_actions,
      requires_retest
    } = req.body;

    // Validate required fields
    if (passed === undefined) {
      return res.status(400).json({ error: 'passed status is required' });
    }

    // Get release to verify facility access
    const release = await req.knex('batch_releases').where('id', releaseId).first();
    if (!release) {
      return res.status(404).json({ error: 'Batch release not found' });
    }

    await authorizeFacility(req, res, release.facility_id);

    // Verify checkpoint exists for this release
    const checkpointResult = await req.knex('checkpoint_results')
      .where('batch_release_id', releaseId)
      .where('checkpoint_id', checkpointId)
      .first();

    if (!checkpointResult) {
      return res.status(404).json({ error: 'Checkpoint not found for this release' });
    }

    if (checkpointResult.status === 'passed' || checkpointResult.status === 'failed') {
      return res.status(400).json({ error: 'Checkpoint already completed' });
    }

    const inspectionData = {
      passed,
      data: data || {},
      photos: photos || [],
      notes,
      failure_reason: !passed ? failure_reason : null,
      corrective_actions: corrective_actions || [],
      requires_retest: requires_retest || false
    };

    const updatedCheckpoint = await BatchRelease.completeCheckpoint(releaseId, checkpointId, inspectionData, req.user.id);

    logger.info(`Checkpoint completed: ${checkpointId} for release ${release.release_number}`, {
      userId: req.user.id,
      releaseId: releaseId,
      checkpointId: checkpointId,
      passed: passed
    });

    res.json({
      success: true,
      data: updatedCheckpoint
    });
  } catch (error) {
    logger.error('Error completing checkpoint:', error);
    res.status(500).json({ error: 'Failed to complete checkpoint' });
  }
});

/**
 * @route PUT /api/batch-releases/:releaseId/approvals/:approvalId
 * @desc Process approval decision
 * @access Private
 */
router.put('/:releaseId/approvals/:approvalId', requirePermission('manage_quality_assurance'), async (req, res) => {
  try {
    const { releaseId, approvalId } = req.params;
    const {
      decision,
      notes,
      rejection_reason,
      digital_signature
    } = req.body;

    // Validate decision
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be either "approved" or "rejected"' });
    }

    if (decision === 'rejected' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required when rejecting' });
    }

    // Get release to verify facility access
    const release = await req.knex('batch_releases').where('id', releaseId).first();
    if (!release) {
      return res.status(404).json({ error: 'Batch release not found' });
    }

    await authorizeFacility(req, res, release.facility_id);

    // Verify user has permission for this approval
    const approval = await req.knex('release_approvals')
      .leftJoin('roles', 'release_approvals.required_role_id', 'roles.id')
      .leftJoin('user_roles', function() {
        this.on('user_roles.role_id', '=', 'roles.id')
            .andOn('user_roles.user_id', '=', req.user.id);
      })
      .select('release_approvals.*', 'roles.name as role_name')
      .where('release_approvals.id', approvalId)
      .where('release_approvals.batch_release_id', releaseId)
      .whereNotNull('user_roles.id') // User must have the required role
      .first();

    if (!approval) {
      return res.status(403).json({ error: 'You do not have permission to approve this release' });
    }

    const approvalData = {
      notes,
      rejection_reason,
      digital_signature: digital_signature || {}
    };

    const updatedApproval = await BatchRelease.processApproval(releaseId, approvalId, decision, approvalData, req.user.id);

    logger.info(`Approval ${decision}: ${approvalId} for release ${release.release_number}`, {
      userId: req.user.id,
      releaseId: releaseId,
      approvalId: approvalId,
      decision: decision
    });

    res.json({
      success: true,
      data: updatedApproval
    });
  } catch (error) {
    logger.error('Error processing approval:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

/**
 * @route PUT /api/batch-releases/:releaseId/release
 * @desc Release batch to inventory
 * @access Private
 */
router.put('/:releaseId/release', requirePermission('manage_quality_assurance'), async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { release_data } = req.body;

    // Get release to verify facility access
    const release = await req.knex('batch_releases').where('id', releaseId).first();
    if (!release) {
      return res.status(404).json({ error: 'Batch release not found' });
    }

    await authorizeFacility(req, res, release.facility_id);

    if (release.status !== 'approved') {
      return res.status(400).json({ error: 'Batch must be approved before it can be released' });
    }

    const updatedRelease = await BatchRelease.releaseBatch(releaseId, release_data, req.user.id);

    logger.info(`Batch released: ${release.release_number}`, {
      userId: req.user.id,
      releaseId: releaseId,
      processingBatchId: release.processing_batch_id
    });

    res.json({
      success: true,
      data: updatedRelease
    });
  } catch (error) {
    logger.error('Error releasing batch:', error);
    res.status(500).json({ error: 'Failed to release batch' });
  }
});

/**
 * @route GET /api/batch-releases/facilities/:facilityId/stats
 * @desc Get batch release statistics for facility
 * @access Private
 */
router.get('/facilities/:facilityId/stats', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { time_range = 30 } = req.query;

    await authorizeFacility(req, res, facilityId);

    const stats = await BatchRelease.getReleaseStats(facilityId, parseInt(time_range));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting release statistics:', error);
    res.status(500).json({ error: 'Failed to get release statistics' });
  }
});

/**
 * @route GET /api/batch-releases/facilities/:facilityId/templates
 * @desc Get batch release templates for facility
 * @access Private
 */
router.get('/facilities/:facilityId/templates', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    await authorizeFacility(req, res, facilityId);

    const templates = await req.knex('batch_release_templates')
      .where('facility_id', facilityId)
      .where('is_active', true)
      .orderBy('name');

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error getting release templates:', error);
    res.status(500).json({ error: 'Failed to get release templates' });
  }
});

/**
 * @route GET /api/batch-releases/facilities/:facilityId/checkpoints
 * @desc Get quality control checkpoints for facility
 * @access Private
 */
router.get('/facilities/:facilityId/checkpoints', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    await authorizeFacility(req, res, facilityId);

    const checkpoints = await req.knex('release_checkpoints')
      .where('facility_id', facilityId)
      .where('is_active', true)
      .orderBy('order_sequence');

    res.json({
      success: true,
      data: checkpoints
    });
  } catch (error) {
    logger.error('Error getting checkpoints:', error);
    res.status(500).json({ error: 'Failed to get checkpoints' });
  }
});

/**
 * @route GET /api/batch-releases/facilities/:facilityId/available-batches
 * @desc Get processing batches available for release workflow
 * @access Private
 */
router.get('/facilities/:facilityId/available-batches', requirePermission('view_quality_assurance'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    await authorizeFacility(req, res, facilityId);

    const availableBatches = await req.knex('processing_batches')
      .leftJoin('batches', 'processing_batches.source_batch_id', 'batches.id')
      .leftJoin('strains', 'batches.strain_id', 'strains.id')
      .leftJoin('batch_releases', 'processing_batches.id', 'batch_releases.processing_batch_id')
      .select(
        'processing_batches.id',
        'processing_batches.processing_batch_number',
        'processing_batches.processing_type',
        'processing_batches.output_weight',
        'processing_batches.actual_completion_date',
        'batches.batch_number as source_batch_number',
        'strains.name as strain_name'
      )
      .where('processing_batches.facility_id', facilityId)
      .where('processing_batches.status', 'completed')
      .whereNull('batch_releases.id') // Not already in release workflow
      .orderBy('processing_batches.actual_completion_date', 'desc');

    res.json({
      success: true,
      data: availableBatches
    });
  } catch (error) {
    logger.error('Error getting available batches:', error);
    res.status(500).json({ error: 'Failed to get available batches' });
  }
});

/**
 * @route PUT /api/batch-releases/:releaseId/status
 * @desc Update batch release status
 * @access Private
 */
router.put('/:releaseId/status', requirePermission('manage_quality_assurance'), async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'on_hold', 'approved', 'released', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get release to verify facility access
    const release = await req.knex('batch_releases').where('id', releaseId).first();
    if (!release) {
      return res.status(404).json({ error: 'Batch release not found' });
    }

    await authorizeFacility(req, res, release.facility_id);

    const updatedRelease = await req.knex('batch_releases')
      .where('id', releaseId)
      .update({
        status: status,
        notes: notes || release.notes,
        updated_at: new Date()
      })
      .returning('*');

    // Log audit event
    await BatchRelease.logAuditEvent(releaseId, req.user.id, 'status_updated', 'batch_release', releaseId, 
      { status: release.status }, 
      { status: status, notes: notes }
    );

    logger.info(`Release status updated: ${release.release_number} -> ${status}`, {
      userId: req.user.id,
      releaseId: releaseId,
      oldStatus: release.status,
      newStatus: status
    });

    res.json({
      success: true,
      data: updatedRelease[0]
    });
  } catch (error) {
    logger.error('Error updating release status:', error);
    res.status(500).json({ error: 'Failed to update release status' });
  }
});

module.exports = router;