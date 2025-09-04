/**
 * Processing Model
 * Handles post-harvest processing operations including drying, curing, trimming, and extraction
 */

const BaseModel = require('./BaseModel');

class Processing extends BaseModel {
  static get tableName() {
    return 'processing_batches';
  }

  /**
   * Create a new processing batch
   */
  static async createBatch(facilityId, batchData, userId = null) {
    try {
      // Generate processing batch number
      const batchNumber = await this.generateBatchNumber(facilityId, batchData.processing_type);
      
      const processingBatch = await this.query().insert({
        facility_id: facilityId,
        source_batch_id: batchData.source_batch_id,
        room_id: batchData.room_id,
        processing_batch_number: batchNumber,
        processing_type: batchData.processing_type,
        status: 'in_progress',
        input_weight: batchData.input_weight,
        current_weight: batchData.input_weight, // Initially same as input
        moisture_content_start: batchData.moisture_content_start,
        moisture_content_target: batchData.moisture_content_target,
        start_date: batchData.start_date || new Date(),
        expected_completion_date: batchData.expected_completion_date,
        processing_parameters: batchData.processing_parameters || {},
        quality_metrics: batchData.quality_metrics || {},
        tags: batchData.tags || [],
        notes: batchData.notes
      });

      // Log compliance event
      await this.logComplianceEvent(facilityId, 'processing_start', 'processing_batch', processingBatch.id, {
        processing_type: batchData.processing_type,
        input_weight: batchData.input_weight,
        source_batch_id: batchData.source_batch_id
      }, userId);

      return processingBatch;
    } catch (error) {
      throw new Error(`Failed to create processing batch: ${error.message}`);
    }
  }

  /**
   * Update processing batch progress
   */
  static async updateProgress(batchId, updateData, userId = null) {
    try {
      const batch = await this.query().findById(batchId);
      if (!batch) {
        throw new Error('Processing batch not found');
      }

      const updatedBatch = await this.query()
        .findById(batchId)
        .patch({
          current_weight: updateData.current_weight,
          moisture_content_current: updateData.moisture_content_current,
          processing_parameters: updateData.processing_parameters || batch.processing_parameters,
          quality_metrics: updateData.quality_metrics || batch.quality_metrics,
          notes: updateData.notes || batch.notes,
          updated_at: new Date()
        });

      // Log progress update
      await this.logComplianceEvent(batch.facility_id, 'processing_update', 'processing_batch', batchId, {
        current_weight: updateData.current_weight,
        moisture_content_current: updateData.moisture_content_current,
        previous_weight: batch.current_weight
      }, userId);

      return updatedBatch;
    } catch (error) {
      throw new Error(`Failed to update processing batch: ${error.message}`);
    }
  }

  /**
   * Complete processing batch
   */
  static async completeBatch(batchId, completionData, userId = null) {
    try {
      const batch = await this.query().findById(batchId);
      if (!batch) {
        throw new Error('Processing batch not found');
      }

      const updatedBatch = await this.query()
        .findById(batchId)
        .patch({
          status: 'completed',
          output_weight: completionData.output_weight,
          waste_weight: completionData.waste_weight || 0,
          actual_completion_date: new Date(),
          quality_metrics: completionData.quality_metrics || batch.quality_metrics,
          notes: completionData.notes || batch.notes,
          updated_at: new Date()
        });

      // Log waste if any
      if (completionData.waste_weight && completionData.waste_weight > 0) {
        await this.logWaste(batch.facility_id, {
          waste_type: 'processing_waste',
          source_type: 'processing_batch',
          source_id: batchId,
          weight: completionData.waste_weight,
          disposal_method: completionData.disposal_method || 'compost',
          reason: `${batch.processing_type}_waste`,
          notes: completionData.waste_notes
        }, userId);
      }

      // Log completion event
      await this.logComplianceEvent(batch.facility_id, 'processing_complete', 'processing_batch', batchId, {
        output_weight: completionData.output_weight,
        waste_weight: completionData.waste_weight,
        yield_percentage: ((completionData.output_weight / batch.input_weight) * 100).toFixed(2)
      }, userId);

      return updatedBatch;
    } catch (error) {
      throw new Error(`Failed to complete processing batch: ${error.message}`);
    }
  }

  /**
   * Get processing batches for facility
   */
  static async getFacilityBatches(facilityId, filters = {}) {
    try {
      let query = this.query()
        .where('facility_id', facilityId)
        .orderBy('created_at', 'desc');

      // Apply filters
      if (filters.processing_type) {
        query = query.where('processing_type', filters.processing_type);
      }

      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.room_id) {
        query = query.where('room_id', filters.room_id);
      }

      if (filters.start_date) {
        query = query.where('start_date', '>=', filters.start_date);
      }

      if (filters.end_date) {
        query = query.where('start_date', '<=', filters.end_date);
      }

      const batches = await query;

      // Enrich with related data
      for (let batch of batches) {
        // Get source batch info
        if (batch.source_batch_id) {
          const sourceBatch = await this.knex('batches')
            .select('batch_number', 'strain_id')
            .where('id', batch.source_batch_id)
            .first();
          batch.source_batch = sourceBatch;
        }

        // Get room info
        if (batch.room_id) {
          const room = await this.knex('rooms')
            .select('name', 'room_type')
            .where('id', batch.room_id)
            .first();
          batch.room = room;
        }
      }

      return batches;
    } catch (error) {
      throw new Error(`Failed to get facility processing batches: ${error.message}`);
    }
  }

  /**
   * Get processing batch details
   */
  static async getBatchDetails(batchId) {
    try {
      const batch = await this.query().findById(batchId);
      if (!batch) {
        throw new Error('Processing batch not found');
      }

      // Get source batch info
      if (batch.source_batch_id) {
        const sourceBatch = await this.knex('batches')
          .select('batch_number', 'strain_id', 'harvest_date')
          .where('id', batch.source_batch_id)
          .first();
        
        if (sourceBatch && sourceBatch.strain_id) {
          const strain = await this.knex('strains')
            .select('name', 'genetics')
            .where('id', sourceBatch.strain_id)
            .first();
          sourceBatch.strain = strain;
        }
        
        batch.source_batch = sourceBatch;
      }

      // Get room info
      if (batch.room_id) {
        const room = await this.knex('rooms')
          .select('name', 'room_type', 'environmental_settings')
          .where('id', batch.room_id)
          .first();
        batch.room = room;
      }

      // Get waste logs
      const wasteLogs = await this.knex('waste_logs')
        .where('source_type', 'processing_batch')
        .where('source_id', batchId)
        .orderBy('created_at', 'desc');
      batch.waste_logs = wasteLogs;

      // Get lab tests
      const labTests = await this.knex('lab_tests')
        .where('processing_batch_id', batchId)
        .orderBy('created_at', 'desc');
      batch.lab_tests = labTests;

      return batch;
    } catch (error) {
      throw new Error(`Failed to get processing batch details: ${error.message}`);
    }
  }

  /**
   * Get processing statistics
   */
  static async getProcessingStats(facilityId, timeRange = 30) {
    try {
      const startDate = new Date(Date.now() - (timeRange * 24 * 60 * 60 * 1000));

      const stats = await this.query()
        .select(
          'processing_type',
          this.raw('COUNT(*) as batch_count'),
          this.raw('SUM(input_weight) as total_input_weight'),
          this.raw('SUM(output_weight) as total_output_weight'),
          this.raw('SUM(waste_weight) as total_waste_weight'),
          this.raw('AVG(CASE WHEN output_weight > 0 THEN (output_weight / input_weight) * 100 END) as avg_yield_percentage')
        )
        .where('facility_id', facilityId)
        .where('created_at', '>=', startDate)
        .groupBy('processing_type');

      // Get active batches count
      const activeBatches = await this.query()
        .where('facility_id', facilityId)
        .where('status', 'in_progress')
        .count('* as count')
        .first();

      return {
        by_type: stats.map(stat => ({
          ...stat,
          avg_yield_percentage: parseFloat(stat.avg_yield_percentage || 0)
        })),
        active_batches: parseInt(activeBatches.count),
        time_range_days: timeRange
      };
    } catch (error) {
      throw new Error(`Failed to get processing statistics: ${error.message}`);
    }
  }

  /**
   * Generate processing batch number
   */
  static async generateBatchNumber(facilityId, processingType) {
    try {
      const prefix = processingType.substring(0, 3).toUpperCase();
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

      // Get the next sequence number for this facility, type, and month
      const lastBatch = await this.query()
        .where('facility_id', facilityId)
        .where('processing_type', processingType)
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [new Date().getFullYear()])
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [new Date().getMonth() + 1])
        .orderBy('created_at', 'desc')
        .first();

      let sequence = 1;
      if (lastBatch) {
        const lastNumber = lastBatch.processing_batch_number;
        const lastSequence = parseInt(lastNumber.split('-').pop());
        sequence = lastSequence + 1;
      }

      return `${prefix}-${year}${month}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      throw new Error(`Failed to generate batch number: ${error.message}`);
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
   * Log waste
   */
  static async logWaste(facilityId, wasteData, userId = null) {
    try {
      await this.knex('waste_logs').insert({
        facility_id: facilityId,
        logged_by_user_id: userId,
        waste_type: wasteData.waste_type,
        source_type: wasteData.source_type,
        source_id: wasteData.source_id,
        weight: wasteData.weight,
        disposal_method: wasteData.disposal_method,
        reason: wasteData.reason,
        notes: wasteData.notes,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error logging waste:', error);
    }
  }

  /**
   * Get processing types
   */
  static getProcessingTypes() {
    return [
      { type: 'drying', name: 'Drying', description: 'Initial drying process after harvest' },
      { type: 'curing', name: 'Curing', description: 'Controlled curing for quality enhancement' },
      { type: 'trimming', name: 'Trimming', description: 'Manual or machine trimming' },
      { type: 'extraction', name: 'Extraction', description: 'Concentrate and extract production' },
      { type: 'packaging', name: 'Packaging', description: 'Final packaging for distribution' },
      { type: 'testing', name: 'Testing', description: 'Quality control and lab testing' }
    ];
  }

  /**
   * Get processing status options
   */
  static getStatusOptions() {
    return [
      { status: 'in_progress', name: 'In Progress', color: '#F59E0B' },
      { status: 'completed', name: 'Completed', color: '#10B981' },
      { status: 'on_hold', name: 'On Hold', color: '#EF4444' },
      { status: 'failed', name: 'Failed', color: '#DC2626' }
    ];
  }
}

module.exports = Processing;