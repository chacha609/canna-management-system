const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * Batch Model
 * Handles batch lifecycle management, plant grouping, and cultivation tracking
 */
class Batch extends BaseModel {
  constructor() {
    super('batches');
  }

  /**
   * Create a new batch with validation
   */
  async create(batchData) {
    try {
      this.validateRequired(batchData, [
        'facility_id', 'batch_number', 'batch_type', 'growth_phase', 'start_date'
      ]);

      // Ensure batch number is unique
      const existingBatch = await this.findOne({ batch_number: batchData.batch_number });
      if (existingBatch) {
        throw new Error(`Batch number ${batchData.batch_number} already exists`);
      }

      const batch = await super.create({
        ...batchData,
        plant_count: batchData.plant_count || 0,
        status: 'active'
      });

      logger.info(`Created new batch: ${batch.batch_number} (${batch.batch_type})`);
      return batch;
    } catch (error) {
      logger.error('Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Get batch with related data (strain, room, parent batch)
   */
  async findByIdWithRelations(id) {
    try {
      const batch = await this.db(this.tableName)
        .select(
          'batches.*',
          'strains.name as strain_name',
          'strains.strain_type',
          'strains.genetics',
          'rooms.name as room_name',
          'rooms.room_type',
          'parent_batch.batch_number as parent_batch_number'
        )
        .leftJoin('strains', 'batches.strain_id', 'strains.id')
        .leftJoin('rooms', 'batches.room_id', 'rooms.id')
        .leftJoin('batches as parent_batch', 'batches.parent_batch_id', 'parent_batch.id')
        .where('batches.id', id)
        .first();

      if (batch) {
        // Parse JSON fields
        batch.cultivation_notes = batch.cultivation_notes ? JSON.parse(batch.cultivation_notes) : {};
        batch.environmental_data = batch.environmental_data ? JSON.parse(batch.environmental_data) : {};
        batch.tags = batch.tags ? JSON.parse(batch.tags) : [];
      }

      return batch;
    } catch (error) {
      logger.error(`Error finding batch with relations by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all batches with related data
   */
  async findAllWithRelations(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName)
        .select(
          'batches.*',
          'strains.name as strain_name',
          'strains.strain_type',
          'rooms.name as room_name',
          'rooms.room_type',
          'parent_batch.batch_number as parent_batch_number'
        )
        .leftJoin('strains', 'batches.strain_id', 'strains.id')
        .leftJoin('rooms', 'batches.room_id', 'rooms.id')
        .leftJoin('batches as parent_batch', 'batches.parent_batch_id', 'parent_batch.id');

      // Apply filters
      if (filters.facility_id) {
        query = query.where('batches.facility_id', filters.facility_id);
      }
      
      if (filters.strain_id) {
        query = query.where('batches.strain_id', filters.strain_id);
      }
      
      if (filters.room_id) {
        query = query.where('batches.room_id', filters.room_id);
      }
      
      if (filters.growth_phase) {
        query = query.where('batches.growth_phase', filters.growth_phase);
      }
      
      if (filters.batch_type) {
        query = query.where('batches.batch_type', filters.batch_type);
      }
      
      if (filters.status) {
        query = query.where('batches.status', filters.status);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      } else {
        query = query.orderBy('batches.created_at', 'desc');
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const batches = await query;

      // Parse JSON fields for each batch
      return batches.map(batch => ({
        ...batch,
        cultivation_notes: batch.cultivation_notes ? JSON.parse(batch.cultivation_notes) : {},
        environmental_data: batch.environmental_data ? JSON.parse(batch.environmental_data) : {},
        tags: batch.tags ? JSON.parse(batch.tags) : []
      }));
    } catch (error) {
      logger.error('Error finding batches with relations:', error);
      throw error;
    }
  }

  /**
   * Update batch growth phase
   */
  async updateGrowthPhase(id, newPhase, userId = null) {
    try {
      const batch = await this.findById(id);
      if (!batch) {
        throw new Error(`Batch with ID ${id} not found`);
      }

      const updateData = {
        growth_phase: newPhase,
        updated_at: new Date()
      };

      // Update expected harvest date based on phase
      if (newPhase === 'flower' && !batch.expected_harvest_date) {
        const strain = await this.db('strains').where('id', batch.strain_id).first();
        if (strain && strain.flowering_time_days) {
          const expectedHarvest = new Date();
          expectedHarvest.setDate(expectedHarvest.getDate() + strain.flowering_time_days);
          updateData.expected_harvest_date = expectedHarvest;
        }
      }

      const updatedBatch = await this.update(id, updateData);
      
      // Also update all plants in this batch
      await this.db('plants')
        .where('batch_id', id)
        .update({ growth_phase: newPhase, updated_at: new Date() });

      logger.info(`Updated batch ${batch.batch_number} growth phase to ${newPhase}`);
      return updatedBatch;
    } catch (error) {
      logger.error(`Error updating batch growth phase for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Move batch to different room
   */
  async moveBatch(id, newRoomId, userId, reason = null) {
    try {
      const batch = await this.findById(id);
      if (!batch) {
        throw new Error(`Batch with ID ${id} not found`);
      }

      // Update batch room
      const updatedBatch = await this.update(id, { room_id: newRoomId });

      // Update all plants in this batch
      await this.db('plants')
        .where('batch_id', id)
        .update({ room_id: newRoomId, updated_at: new Date() });

      // Log movements for all plants in batch
      const plants = await this.db('plants').where('batch_id', id).select('id');
      
      for (const plant of plants) {
        await this.db('plant_movements').insert({
          plant_id: plant.id,
          from_room_id: batch.room_id,
          to_room_id: newRoomId,
          moved_by_user_id: userId,
          reason: reason || `Batch ${batch.batch_number} moved to new room`,
          moved_at: new Date()
        });
      }

      logger.info(`Moved batch ${batch.batch_number} to room ${newRoomId}`);
      return updatedBatch;
    } catch (error) {
      logger.error(`Error moving batch ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(id) {
    try {
      const batch = await this.findById(id);
      if (!batch) {
        throw new Error(`Batch with ID ${id} not found`);
      }

      // Get plant counts by status
      const plantStats = await this.db('plants')
        .select('status')
        .count('* as count')
        .where('batch_id', id)
        .groupBy('status');

      // Get plant counts by growth phase
      const phaseStats = await this.db('plants')
        .select('growth_phase')
        .count('* as count')
        .where('batch_id', id)
        .groupBy('growth_phase');

      // Get total weights
      const weightStats = await this.db('plants')
        .where('batch_id', id)
        .sum('current_weight as total_current_weight')
        .sum('harvest_weight as total_harvest_weight')
        .first();

      // Get health issues count
      const healthIssues = await this.db('plant_health_logs')
        .where('batch_id', id)
        .whereIn('observation_type', ['issue', 'treatment'])
        .count('* as count')
        .first();

      return {
        batch_id: id,
        batch_number: batch.batch_number,
        plant_stats: plantStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        phase_stats: phaseStats.reduce((acc, stat) => {
          acc[stat.growth_phase] = parseInt(stat.count);
          return acc;
        }, {}),
        total_current_weight: parseFloat(weightStats.total_current_weight) || 0,
        total_harvest_weight: parseFloat(weightStats.total_harvest_weight) || 0,
        health_issues_count: parseInt(healthIssues.count) || 0
      };
    } catch (error) {
      logger.error(`Error getting batch stats for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get batch timeline/history
   */
  async getBatchTimeline(id) {
    try {
      const batch = await this.findById(id);
      if (!batch) {
        throw new Error(`Batch with ID ${id} not found`);
      }

      // Get plant movements
      const movements = await this.db('plant_movements')
        .select(
          'plant_movements.*',
          'plants.plant_tag',
          'from_room.name as from_room_name',
          'to_room.name as to_room_name',
          'users.username as moved_by_username'
        )
        .join('plants', 'plant_movements.plant_id', 'plants.id')
        .leftJoin('rooms as from_room', 'plant_movements.from_room_id', 'from_room.id')
        .leftJoin('rooms as to_room', 'plant_movements.to_room_id', 'to_room.id')
        .leftJoin('users', 'plant_movements.moved_by_user_id', 'users.id')
        .where('plants.batch_id', id)
        .orderBy('moved_at', 'desc');

      // Get health observations
      const healthLogs = await this.db('plant_health_logs')
        .select(
          'plant_health_logs.*',
          'plants.plant_tag',
          'users.username as logged_by_username'
        )
        .join('plants', 'plant_health_logs.plant_id', 'plants.id')
        .leftJoin('users', 'plant_health_logs.logged_by_user_id', 'users.id')
        .where('plant_health_logs.batch_id', id)
        .orderBy('observed_at', 'desc');

      // Get tasks related to this batch
      const tasks = await this.db('tasks')
        .select(
          'tasks.*',
          'users.username as assigned_to_username'
        )
        .leftJoin('users', 'tasks.assigned_to_user_id', 'users.id')
        .where('batch_id', id)
        .orderBy('created_at', 'desc');

      return {
        batch_id: id,
        batch_number: batch.batch_number,
        movements: movements,
        health_logs: healthLogs.map(log => ({
          ...log,
          symptoms: log.symptoms ? JSON.parse(log.symptoms) : [],
          treatments_applied: log.treatments_applied ? JSON.parse(log.treatments_applied) : [],
          photos: log.photos ? JSON.parse(log.photos) : []
        })),
        tasks: tasks
      };
    } catch (error) {
      logger.error(`Error getting batch timeline for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Split batch into multiple batches
   */
  async splitBatch(id, splitData, userId) {
    try {
      return await this.transaction(async (trx) => {
        const originalBatch = await trx('batches').where('id', id).first();
        if (!originalBatch) {
          throw new Error(`Batch with ID ${id} not found`);
        }

        const newBatches = [];

        for (const split of splitData.splits) {
          // Create new batch
          const newBatch = await trx('batches').insert({
            facility_id: originalBatch.facility_id,
            strain_id: originalBatch.strain_id,
            room_id: split.room_id || originalBatch.room_id,
            batch_number: split.batch_number,
            batch_name: split.batch_name,
            batch_type: originalBatch.batch_type,
            growth_phase: originalBatch.growth_phase,
            start_date: originalBatch.start_date,
            expected_harvest_date: originalBatch.expected_harvest_date,
            parent_batch_id: id,
            plant_count: split.plant_ids.length,
            cultivation_notes: originalBatch.cultivation_notes,
            environmental_data: originalBatch.environmental_data,
            tags: originalBatch.tags,
            status: 'active'
          }).returning('*');

          // Move specified plants to new batch
          await trx('plants')
            .whereIn('id', split.plant_ids)
            .update({
              batch_id: newBatch[0].id,
              room_id: split.room_id || originalBatch.room_id,
              updated_at: new Date()
            });

          newBatches.push(newBatch[0]);
        }

        // Update original batch plant count
        const remainingPlantCount = await trx('plants')
          .where('batch_id', id)
          .count('* as count')
          .first();

        await trx('batches')
          .where('id', id)
          .update({
            plant_count: parseInt(remainingPlantCount.count),
            updated_at: new Date()
          });

        logger.info(`Split batch ${originalBatch.batch_number} into ${newBatches.length} new batches`);
        return newBatches;
      });
    } catch (error) {
      logger.error(`Error splitting batch ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get batches by facility
   */
  async findByFacility(facilityId, options = {}) {
    try {
      return await this.findAllWithRelations({ facility_id: facilityId }, options);
    } catch (error) {
      logger.error(`Error finding batches by facility ID ${facilityId}:`, error);
      throw error;
    }
  }

  /**
   * Get active batches
   */
  async findActive(facilityId, options = {}) {
    try {
      return await this.findAllWithRelations({ 
        facility_id: facilityId, 
        status: 'active' 
      }, options);
    } catch (error) {
      logger.error(`Error finding active batches for facility ID ${facilityId}:`, error);
      throw error;
    }
  }
}

module.exports = new Batch();