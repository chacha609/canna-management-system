const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * Plant Model
 * Handles individual plant tracking, lifecycle management, and cultivation data
 */
class Plant extends BaseModel {
  constructor() {
    super('plants');
  }

  /**
   * Create a new plant with validation
   */
  async create(plantData) {
    try {
      this.validateRequired(plantData, [
        'facility_id', 'strain_id', 'batch_id', 'plant_tag', 
        'plant_type', 'growth_phase', 'planted_date'
      ]);

      // Ensure plant tag is unique
      const existingPlant = await this.findOne({ plant_tag: plantData.plant_tag });
      if (existingPlant) {
        throw new Error(`Plant tag ${plantData.plant_tag} already exists`);
      }

      const plant = await super.create({
        ...plantData,
        status: 'active',
        is_mother_plant: plantData.is_mother_plant || false
      });

      logger.info(`Created new plant: ${plant.plant_tag} in batch ${plant.batch_id}`);
      return plant;
    } catch (error) {
      logger.error('Error creating plant:', error);
      throw error;
    }
  }

  /**
   * Get plant with related data (strain, batch, room)
   */
  async findByIdWithRelations(id) {
    try {
      const plant = await this.db(this.tableName)
        .select(
          'plants.*',
          'strains.name as strain_name',
          'strains.strain_type',
          'batches.batch_number',
          'batches.batch_name',
          'rooms.name as room_name',
          'rooms.room_type'
        )
        .leftJoin('strains', 'plants.strain_id', 'strains.id')
        .leftJoin('batches', 'plants.batch_id', 'batches.id')
        .leftJoin('rooms', 'plants.room_id', 'rooms.id')
        .where('plants.id', id)
        .first();

      if (plant) {
        // Parse JSON fields
        plant.health_status = plant.health_status ? JSON.parse(plant.health_status) : {};
        plant.cultivation_data = plant.cultivation_data ? JSON.parse(plant.cultivation_data) : {};
        plant.tags = plant.tags ? JSON.parse(plant.tags) : [];
      }

      return plant;
    } catch (error) {
      logger.error(`Error finding plant with relations by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all plants with related data
   */
  async findAllWithRelations(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName)
        .select(
          'plants.*',
          'strains.name as strain_name',
          'strains.strain_type',
          'batches.batch_number',
          'batches.batch_name',
          'rooms.name as room_name',
          'rooms.room_type'
        )
        .leftJoin('strains', 'plants.strain_id', 'strains.id')
        .leftJoin('batches', 'plants.batch_id', 'batches.id')
        .leftJoin('rooms', 'plants.room_id', 'rooms.id');

      // Apply filters
      if (filters.facility_id) {
        query = query.where('plants.facility_id', filters.facility_id);
      }
      
      if (filters.batch_id) {
        query = query.where('plants.batch_id', filters.batch_id);
      }
      
      if (filters.room_id) {
        query = query.where('plants.room_id', filters.room_id);
      }
      
      if (filters.growth_phase) {
        query = query.where('plants.growth_phase', filters.growth_phase);
      }
      
      if (filters.status) {
        query = query.where('plants.status', filters.status);
      }
      
      if (filters.is_mother_plant !== undefined) {
        query = query.where('plants.is_mother_plant', filters.is_mother_plant);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      } else {
        query = query.orderBy('plants.created_at', 'desc');
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const plants = await query;

      // Parse JSON fields for each plant
      return plants.map(plant => ({
        ...plant,
        health_status: plant.health_status ? JSON.parse(plant.health_status) : {},
        cultivation_data: plant.cultivation_data ? JSON.parse(plant.cultivation_data) : {},
        tags: plant.tags ? JSON.parse(plant.tags) : []
      }));
    } catch (error) {
      logger.error('Error finding plants with relations:', error);
      throw error;
    }
  }

  /**
   * Update plant growth phase
   */
  async updateGrowthPhase(id, newPhase, userId = null) {
    try {
      const plant = await this.findById(id);
      if (!plant) {
        throw new Error(`Plant with ID ${id} not found`);
      }

      const updateData = {
        growth_phase: newPhase,
        updated_at: new Date()
      };

      // Log the phase change
      if (userId) {
        await this.logHealthObservation(id, {
          observation_type: 'phase_change',
          observations: `Growth phase changed from ${plant.growth_phase} to ${newPhase}`,
          logged_by_user_id: userId
        });
      }

      const updatedPlant = await this.update(id, updateData);
      logger.info(`Updated plant ${plant.plant_tag} growth phase to ${newPhase}`);
      
      return updatedPlant;
    } catch (error) {
      logger.error(`Error updating plant growth phase for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Move plant to different room/location
   */
  async movePlant(id, newRoomId, newLocation, userId, reason = null) {
    try {
      const plant = await this.findById(id);
      if (!plant) {
        throw new Error(`Plant with ID ${id} not found`);
      }

      // Log the movement
      await this.db('plant_movements').insert({
        plant_id: id,
        from_room_id: plant.room_id,
        to_room_id: newRoomId,
        from_location: plant.location_code,
        to_location: newLocation,
        moved_by_user_id: userId,
        reason: reason,
        moved_at: new Date()
      });

      // Update plant location
      const updatedPlant = await this.update(id, {
        room_id: newRoomId,
        location_code: newLocation
      });

      logger.info(`Moved plant ${plant.plant_tag} to room ${newRoomId}, location ${newLocation}`);
      return updatedPlant;
    } catch (error) {
      logger.error(`Error moving plant ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Log health observation
   */
  async logHealthObservation(plantId, observationData) {
    try {
      const plant = await this.findById(plantId);
      if (!plant) {
        throw new Error(`Plant with ID ${plantId} not found`);
      }

      const healthLog = await this.db('plant_health_logs').insert({
        plant_id: plantId,
        batch_id: plant.batch_id,
        ...observationData,
        observed_at: observationData.observed_at || new Date()
      }).returning('*');

      logger.info(`Logged health observation for plant ${plant.plant_tag}`);
      return healthLog[0];
    } catch (error) {
      logger.error(`Error logging health observation for plant ID ${plantId}:`, error);
      throw error;
    }
  }

  /**
   * Get plant health history
   */
  async getHealthHistory(plantId) {
    try {
      const healthLogs = await this.db('plant_health_logs')
        .select(
          'plant_health_logs.*',
          'users.username as logged_by_username'
        )
        .leftJoin('users', 'plant_health_logs.logged_by_user_id', 'users.id')
        .where('plant_id', plantId)
        .orderBy('observed_at', 'desc');

      // Parse JSON fields
      return healthLogs.map(log => ({
        ...log,
        symptoms: log.symptoms ? JSON.parse(log.symptoms) : [],
        treatments_applied: log.treatments_applied ? JSON.parse(log.treatments_applied) : [],
        photos: log.photos ? JSON.parse(log.photos) : []
      }));
    } catch (error) {
      logger.error(`Error getting health history for plant ID ${plantId}:`, error);
      throw error;
    }
  }

  /**
   * Get plant movement history
   */
  async getMovementHistory(plantId) {
    try {
      const movements = await this.db('plant_movements')
        .select(
          'plant_movements.*',
          'from_room.name as from_room_name',
          'to_room.name as to_room_name',
          'users.username as moved_by_username'
        )
        .leftJoin('rooms as from_room', 'plant_movements.from_room_id', 'from_room.id')
        .leftJoin('rooms as to_room', 'plant_movements.to_room_id', 'to_room.id')
        .leftJoin('users', 'plant_movements.moved_by_user_id', 'users.id')
        .where('plant_id', plantId)
        .orderBy('moved_at', 'desc');

      return movements;
    } catch (error) {
      logger.error(`Error getting movement history for plant ID ${plantId}:`, error);
      throw error;
    }
  }

  /**
   * Get plants by batch
   */
  async findByBatch(batchId, options = {}) {
    try {
      return await this.findAllWithRelations({ batch_id: batchId }, options);
    } catch (error) {
      logger.error(`Error finding plants by batch ID ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Get plants by room
   */
  async findByRoom(roomId, options = {}) {
    try {
      return await this.findAllWithRelations({ room_id: roomId }, options);
    } catch (error) {
      logger.error(`Error finding plants by room ID ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Get mother plants
   */
  async findMotherPlants(facilityId, options = {}) {
    try {
      return await this.findAllWithRelations({ 
        facility_id: facilityId, 
        is_mother_plant: true,
        status: 'active'
      }, options);
    } catch (error) {
      logger.error(`Error finding mother plants for facility ID ${facilityId}:`, error);
      throw error;
    }
  }

  /**
   * Harvest plant
   */
  async harvestPlant(id, harvestData, userId) {
    try {
      const plant = await this.findById(id);
      if (!plant) {
        throw new Error(`Plant with ID ${id} not found`);
      }

      const updateData = {
        status: 'harvested',
        harvest_date: harvestData.harvest_date || new Date(),
        harvest_weight: harvestData.harvest_weight,
        growth_phase: 'harvested'
      };

      // Log harvest observation
      await this.logHealthObservation(id, {
        observation_type: 'harvest',
        observations: `Plant harvested. Weight: ${harvestData.harvest_weight}g`,
        logged_by_user_id: userId
      });

      const updatedPlant = await this.update(id, updateData);
      logger.info(`Harvested plant ${plant.plant_tag} with weight ${harvestData.harvest_weight}g`);
      
      return updatedPlant;
    } catch (error) {
      logger.error(`Error harvesting plant ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = new Plant();