/**
 * BatchRelease Model
 * Handles batch release workflows, quality control checkpoints, and approval systems
 */

const BaseModel = require('./BaseModel');

class BatchRelease extends BaseModel {
  static get tableName() {
    return 'batch_releases';
  }

  /**
   * Create a new batch release workflow
   */
  static async createRelease(facilityId, releaseData, userId = null) {
    try {
      // Generate release number
      const releaseNumber = await this.generateReleaseNumber(facilityId);
      
      const release = await this.query().insert({
        facility_id: facilityId,
        processing_batch_id: releaseData.processing_batch_id,
        template_id: releaseData.template_id,
        release_number: releaseNumber,
        status: 'pending',
        initiated_by_user_id: userId,
        target_completion_date: releaseData.target_completion_date,
        notes: releaseData.notes
      });

      // Initialize checkpoints based on template
      await this.initializeCheckpoints(release.id, releaseData.template_id);

      // Initialize approval chain
      await this.initializeApprovalChain(release.id, releaseData.template_id);

      // Log audit event
      await this.logAuditEvent(release.id, userId, 'release_initiated', 'batch_release', release.id, {}, {
        release_number: releaseNumber,
        template_id: releaseData.template_id,
        processing_batch_id: releaseData.processing_batch_id
      });

      // Send notifications
      await this.sendNotifications(release.id, 'release_initiated');

      return release;
    } catch (error) {
      throw new Error(`Failed to create batch release: ${error.message}`);
    }
  }

  /**
   * Get batch release details with all related data
   */
  static async getReleaseDetails(releaseId) {
    try {
      const release = await this.query().findById(releaseId);
      if (!release) {
        throw new Error('Batch release not found');
      }

      // Get processing batch info
      const processingBatch = await this.knex('processing_batches')
        .leftJoin('batches', 'processing_batches.source_batch_id', 'batches.id')
        .leftJoin('strains', 'batches.strain_id', 'strains.id')
        .leftJoin('rooms', 'processing_batches.room_id', 'rooms.id')
        .select(
          'processing_batches.*',
          'batches.batch_number as source_batch_number',
          'strains.name as strain_name',
          'rooms.name as room_name'
        )
        .where('processing_batches.id', release.processing_batch_id)
        .first();

      // Get template info
      const template = await this.knex('batch_release_templates')
        .where('id', release.template_id)
        .first();

      // Get checkpoint results
      const checkpointResults = await this.knex('checkpoint_results')
        .leftJoin('release_checkpoints', 'checkpoint_results.checkpoint_id', 'release_checkpoints.id')
        .leftJoin('users', 'checkpoint_results.inspector_user_id', 'users.id')
        .select(
          'checkpoint_results.*',
          'release_checkpoints.name as checkpoint_name',
          'release_checkpoints.checkpoint_type',
          'release_checkpoints.order_sequence',
          'users.username as inspector_name'
        )
        .where('checkpoint_results.batch_release_id', releaseId)
        .orderBy('release_checkpoints.order_sequence');

      // Get approval status
      const approvals = await this.knex('release_approvals')
        .leftJoin('roles', 'release_approvals.required_role_id', 'roles.id')
        .leftJoin('users', 'release_approvals.approver_user_id', 'users.id')
        .select(
          'release_approvals.*',
          'roles.name as role_name',
          'users.username as approver_name'
        )
        .where('release_approvals.batch_release_id', releaseId)
        .orderBy('release_approvals.order_sequence');

      // Get documents
      const documents = await this.knex('release_documents')
        .leftJoin('users', 'release_documents.uploaded_by_user_id', 'users.id')
        .select(
          'release_documents.*',
          'users.username as uploaded_by_name'
        )
        .where('release_documents.batch_release_id', releaseId)
        .orderBy('release_documents.created_at', 'desc');

      // Get audit log
      const auditLog = await this.knex('release_audit_log')
        .leftJoin('users', 'release_audit_log.user_id', 'users.id')
        .select(
          'release_audit_log.*',
          'users.username as user_name'
        )
        .where('release_audit_log.batch_release_id', releaseId)
        .orderBy('release_audit_log.created_at', 'desc');

      return {
        ...release,
        processing_batch: processingBatch,
        template: template,
        checkpoint_results: checkpointResults,
        approvals: approvals,
        documents: documents,
        audit_log: auditLog
      };
    } catch (error) {
      throw new Error(`Failed to get release details: ${error.message}`);
    }
  }

  /**
   * Complete a quality control checkpoint
   */
  static async completeCheckpoint(releaseId, checkpointId, inspectionData, userId = null) {
    try {
      const release = await this.query().findById(releaseId);
      if (!release) {
        throw new Error('Batch release not found');
      }

      if (release.status !== 'in_progress' && release.status !== 'pending') {
        throw new Error('Cannot complete checkpoint for release in current status');
      }

      // Update checkpoint result
      const checkpointResult = await this.knex('checkpoint_results')
        .where('batch_release_id', releaseId)
        .where('checkpoint_id', checkpointId)
        .update({
          status: inspectionData.passed ? 'passed' : 'failed',
          inspector_user_id: userId,
          completed_at: new Date(),
          inspection_data: inspectionData.data || {},
          photos: inspectionData.photos || [],
          inspector_notes: inspectionData.notes,
          failure_reason: inspectionData.failure_reason,
          corrective_actions: inspectionData.corrective_actions || [],
          requires_retest: inspectionData.requires_retest || false,
          updated_at: new Date()
        })
        .returning('*');

      // Check if all mandatory checkpoints are complete
      const allCheckpoints = await this.knex('checkpoint_results')
        .leftJoin('release_checkpoints', 'checkpoint_results.checkpoint_id', 'release_checkpoints.id')
        .where('checkpoint_results.batch_release_id', releaseId)
        .where('release_checkpoints.is_mandatory', true);

      const completedCheckpoints = allCheckpoints.filter(cp => cp.status === 'passed');
      const failedCheckpoints = allCheckpoints.filter(cp => cp.status === 'failed');

      let newStatus = release.status;
      if (failedCheckpoints.length > 0) {
        newStatus = 'on_hold';
      } else if (completedCheckpoints.length === allCheckpoints.length) {
        newStatus = 'approved';
        // Trigger approval workflow
        await this.triggerApprovalWorkflow(releaseId);
      } else {
        newStatus = 'in_progress';
      }

      // Update release status
      if (newStatus !== release.status) {
        await this.query().findById(releaseId).patch({
          status: newStatus,
          updated_at: new Date()
        });
      }

      // Log audit event
      await this.logAuditEvent(releaseId, userId, 'checkpoint_completed', 'checkpoint_result', checkpointResult[0].id, {}, {
        checkpoint_id: checkpointId,
        status: inspectionData.passed ? 'passed' : 'failed',
        inspection_data: inspectionData.data
      });

      // Send notifications
      await this.sendNotifications(releaseId, 'checkpoint_completed', {
        checkpoint_id: checkpointId,
        status: inspectionData.passed ? 'passed' : 'failed'
      });

      return checkpointResult[0];
    } catch (error) {
      throw new Error(`Failed to complete checkpoint: ${error.message}`);
    }
  }

  /**
   * Process approval decision
   */
  static async processApproval(releaseId, approvalId, decision, approvalData, userId = null) {
    try {
      const approval = await this.knex('release_approvals')
        .where('id', approvalId)
        .where('batch_release_id', releaseId)
        .first();

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== 'pending') {
        throw new Error('Approval already processed');
      }

      // Update approval
      await this.knex('release_approvals')
        .where('id', approvalId)
        .update({
          status: decision, // 'approved' or 'rejected'
          approver_user_id: userId,
          responded_at: new Date(),
          approval_notes: approvalData.notes,
          rejection_reason: decision === 'rejected' ? approvalData.rejection_reason : null,
          digital_signature: approvalData.digital_signature || {},
          updated_at: new Date()
        });

      // Check if all approvals are complete
      const allApprovals = await this.knex('release_approvals')
        .where('batch_release_id', releaseId)
        .orderBy('order_sequence');

      const approvedCount = allApprovals.filter(a => a.status === 'approved' || (a.id === approvalId && decision === 'approved')).length;
      const rejectedCount = allApprovals.filter(a => a.status === 'rejected' || (a.id === approvalId && decision === 'rejected')).length;

      let releaseStatus = 'approved';
      if (rejectedCount > 0) {
        releaseStatus = 'rejected';
      } else if (approvedCount < allApprovals.length) {
        releaseStatus = 'approved'; // Still waiting for more approvals
      } else {
        releaseStatus = 'approved'; // All approvals complete
      }

      // Update release status
      await this.query().findById(releaseId).patch({
        status: releaseStatus,
        approved_by_user_id: decision === 'approved' && approvedCount === allApprovals.length ? userId : null,
        approved_at: decision === 'approved' && approvedCount === allApprovals.length ? new Date() : null,
        updated_at: new Date()
      });

      // Log audit event
      await this.logAuditEvent(releaseId, userId, `approval_${decision}`, 'release_approval', approvalId, {}, {
        approval_level: approval.approval_level,
        decision: decision,
        notes: approvalData.notes
      });

      // Send notifications
      await this.sendNotifications(releaseId, `approval_${decision}`, {
        approval_level: approval.approval_level,
        approver_id: userId
      });

      return approval;
    } catch (error) {
      throw new Error(`Failed to process approval: ${error.message}`);
    }
  }

  /**
   * Release batch to inventory
   */
  static async releaseBatch(releaseId, releaseData, userId = null) {
    try {
      const release = await this.query().findById(releaseId);
      if (!release) {
        throw new Error('Batch release not found');
      }

      if (release.status !== 'approved') {
        throw new Error('Batch must be approved before release');
      }

      // Update release status
      await this.query().findById(releaseId).patch({
        status: 'released',
        released_by_user_id: userId,
        released_at: new Date(),
        actual_completion_date: new Date(),
        release_data: releaseData || {},
        updated_at: new Date()
      });

      // Update processing batch status
      await this.knex('processing_batches')
        .where('id', release.processing_batch_id)
        .update({
          status: 'released',
          updated_at: new Date()
        });

      // Log compliance event
      await this.logComplianceEvent(release.facility_id, 'batch_released', 'batch_release', releaseId, {
        release_number: release.release_number,
        processing_batch_id: release.processing_batch_id,
        released_by: userId
      }, userId);

      // Log audit event
      await this.logAuditEvent(releaseId, userId, 'batch_released', 'batch_release', releaseId, {}, {
        release_data: releaseData
      });

      // Send notifications
      await this.sendNotifications(releaseId, 'batch_released');

      return release;
    } catch (error) {
      throw new Error(`Failed to release batch: ${error.message}`);
    }
  }

  /**
   * Get facility releases with filtering
   */
  static async getFacilityReleases(facilityId, filters = {}) {
    try {
      let query = this.query()
        .leftJoin('processing_batches', 'batch_releases.processing_batch_id', 'processing_batches.id')
        .leftJoin('batches', 'processing_batches.source_batch_id', 'batches.id')
        .leftJoin('strains', 'batches.strain_id', 'strains.id')
        .leftJoin('batch_release_templates', 'batch_releases.template_id', 'batch_release_templates.id')
        .leftJoin('users as initiator', 'batch_releases.initiated_by_user_id', 'initiator.id')
        .select(
          'batch_releases.*',
          'processing_batches.processing_batch_number',
          'processing_batches.processing_type',
          'batches.batch_number as source_batch_number',
          'strains.name as strain_name',
          'batch_release_templates.name as template_name',
          'batch_release_templates.product_type',
          'initiator.username as initiated_by_name'
        )
        .where('batch_releases.facility_id', facilityId)
        .orderBy('batch_releases.created_at', 'desc');

      // Apply filters
      if (filters.status) {
        query = query.where('batch_releases.status', filters.status);
      }

      if (filters.product_type) {
        query = query.where('batch_release_templates.product_type', filters.product_type);
      }

      if (filters.processing_type) {
        query = query.where('processing_batches.processing_type', filters.processing_type);
      }

      if (filters.start_date) {
        query = query.where('batch_releases.initiated_at', '>=', filters.start_date);
      }

      if (filters.end_date) {
        query = query.where('batch_releases.initiated_at', '<=', filters.end_date);
      }

      const releases = await query;

      // Get checkpoint progress for each release
      for (let release of releases) {
        const checkpointStats = await this.knex('checkpoint_results')
          .leftJoin('release_checkpoints', 'checkpoint_results.checkpoint_id', 'release_checkpoints.id')
          .select(
            this.knex.raw('COUNT(*) as total_checkpoints'),
            this.knex.raw('COUNT(CASE WHEN checkpoint_results.status = ? THEN 1 END) as completed_checkpoints', ['passed']),
            this.knex.raw('COUNT(CASE WHEN checkpoint_results.status = ? THEN 1 END) as failed_checkpoints', ['failed'])
          )
          .where('checkpoint_results.batch_release_id', release.id)
          .where('release_checkpoints.is_mandatory', true)
          .first();

        release.checkpoint_progress = checkpointStats;
      }

      return releases;
    } catch (error) {
      throw new Error(`Failed to get facility releases: ${error.message}`);
    }
  }

  /**
   * Get release statistics
   */
  static async getReleaseStats(facilityId, timeRange = 30) {
    try {
      const startDate = new Date(Date.now() - (timeRange * 24 * 60 * 60 * 1000));

      const stats = await this.query()
        .select(
          'status',
          this.raw('COUNT(*) as count'),
          this.raw('AVG(EXTRACT(EPOCH FROM (actual_completion_date - initiated_at))/3600) as avg_duration_hours')
        )
        .where('facility_id', facilityId)
        .where('initiated_at', '>=', startDate)
        .groupBy('status');

      // Get total releases
      const totalReleases = await this.query()
        .where('facility_id', facilityId)
        .where('initiated_at', '>=', startDate)
        .count('* as count')
        .first();

      // Get average checkpoint completion time
      const avgCheckpointTime = await this.knex('checkpoint_results')
        .leftJoin('batch_releases', 'checkpoint_results.batch_release_id', 'batch_releases.id')
        .select(
          this.raw('AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_hours')
        )
        .where('batch_releases.facility_id', facilityId)
        .where('checkpoint_results.completed_at', '>=', startDate)
        .whereNotNull('checkpoint_results.completed_at')
        .first();

      return {
        by_status: stats.map(stat => ({
          ...stat,
          avg_duration_hours: parseFloat(stat.avg_duration_hours || 0)
        })),
        total_releases: parseInt(totalReleases.count),
        avg_checkpoint_completion_hours: parseFloat(avgCheckpointTime.avg_hours || 0),
        time_range_days: timeRange
      };
    } catch (error) {
      throw new Error(`Failed to get release statistics: ${error.message}`);
    }
  }

  /**
   * Initialize checkpoints for a release based on template
   */
  static async initializeCheckpoints(releaseId, templateId) {
    try {
      const template = await this.knex('batch_release_templates').where('id', templateId).first();
      if (!template) {
        throw new Error('Template not found');
      }

      const checkpointIds = template.checkpoint_sequence || [];
      
      for (let i = 0; i < checkpointIds.length; i++) {
        await this.knex('checkpoint_results').insert({
          batch_release_id: releaseId,
          checkpoint_id: checkpointIds[i],
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize checkpoints: ${error.message}`);
    }
  }

  /**
   * Initialize approval chain for a release
   */
  static async initializeApprovalChain(releaseId, templateId) {
    try {
      const template = await this.knex('batch_release_templates').where('id', templateId).first();
      if (!template) {
        throw new Error('Template not found');
      }

      const approvalChain = template.approval_chain || [];
      
      for (let i = 0; i < approvalChain.length; i++) {
        const roleId = approvalChain[i];
        const role = await this.knex('roles').where('id', roleId).first();
        
        await this.knex('release_approvals').insert({
          batch_release_id: releaseId,
          approval_level: role.name.toLowerCase().replace(' ', '_'),
          required_role_id: roleId,
          status: 'pending',
          order_sequence: i + 1,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize approval chain: ${error.message}`);
    }
  }

  /**
   * Trigger approval workflow
   */
  static async triggerApprovalWorkflow(releaseId) {
    try {
      // Get first pending approval
      const firstApproval = await this.knex('release_approvals')
        .where('batch_release_id', releaseId)
        .where('status', 'pending')
        .orderBy('order_sequence')
        .first();

      if (firstApproval) {
        // Send notification to required role users
        await this.sendNotifications(releaseId, 'approval_required', {
          approval_id: firstApproval.id,
          role_id: firstApproval.required_role_id
        });
      }
    } catch (error) {
      console.error('Error triggering approval workflow:', error);
    }
  }

  /**
   * Generate release number
   */
  static async generateReleaseNumber(facilityId) {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

      // Get the next sequence number for this facility and month
      const lastRelease = await this.query()
        .where('facility_id', facilityId)
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [new Date().getFullYear()])
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [new Date().getMonth() + 1])
        .orderBy('created_at', 'desc')
        .first();

      let sequence = 1;
      if (lastRelease) {
        const lastNumber = lastRelease.release_number;
        const lastSequence = parseInt(lastNumber.split('-').pop());
        sequence = lastSequence + 1;
      }

      return `REL-${year}${month}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      throw new Error(`Failed to generate release number: ${error.message}`);
    }
  }

  /**
   * Log audit event
   */
  static async logAuditEvent(releaseId, userId, action, entityType, entityId, oldValues, newValues, notes = null) {
    try {
      await this.knex('release_audit_log').insert({
        batch_release_id: releaseId,
        user_id: userId,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues || {},
        new_values: newValues || {},
        notes: notes,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Log compliance event
   */
  static async logComplianceEvent(facilityId, eventType, entityType, entityId, eventData, userId = null) {
    try {
      await this.knex('compliance_events').insert({
        facility_id: facilityId,
        user_id: userId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        event_data: eventData,
        status: 'pending',
        event_timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error logging compliance event:', error);
    }
  }

  /**
   * Send notifications
   */
  static async sendNotifications(releaseId, notificationType, data = {}) {
    try {
      // This would integrate with your notification system
      // For now, we'll just log the notification
      console.log(`Notification: ${notificationType} for release ${releaseId}`, data);
      
      // TODO: Implement actual notification sending
      // - Email notifications
      // - In-app notifications
      // - SMS for urgent notifications
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Get release status options
   */
  static getStatusOptions() {
    return [
      { status: 'pending', name: 'Pending', color: '#6B7280' },
      { status: 'in_progress', name: 'In Progress', color: '#F59E0B' },
      { status: 'on_hold', name: 'On Hold', color: '#EF4444' },
      { status: 'approved', name: 'Approved', color: '#10B981' },
      { status: 'released', name: 'Released', color: '#059669' },
      { status: 'rejected', name: 'Rejected', color: '#DC2626' }
    ];
  }
}

module.exports = BatchRelease;