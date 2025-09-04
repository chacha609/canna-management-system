const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * METRC Model
 * Handles METRC integration data and synchronization
 */
class Metrc extends BaseModel {
  constructor() {
    super('metrc_sync_logs');
  }

  /**
   * Log METRC sync operation
   */
  async logSync(facilityId, userId, syncType, data, status = 'success', error = null) {
    try {
      const logEntry = await this.create({
        facility_id: facilityId,
        user_id: userId,
        sync_type: syncType,
        sync_data: JSON.stringify(data),
        status: status,
        error_message: error,
        synced_at: new Date()
      });

      logger.info(`METRC sync logged: ${syncType} for facility ${facilityId}`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging METRC sync:', error);
      throw error;
    }
  }

  /**
   * Get sync history for a facility
   */
  async getSyncHistory(facilityId, options = {}) {
    try {
      let query = this.db(this.tableName)
        .select(
          'metrc_sync_logs.*',
          'users.username as user_name'
        )
        .leftJoin('users', 'metrc_sync_logs.user_id', 'users.id')
        .where('facility_id', facilityId);

      // Apply filters
      if (options.sync_type) {
        query = query.where('sync_type', options.sync_type);
      }

      if (options.status) {
        query = query.where('status', options.status);
      }

      if (options.from_date) {
        query = query.where('synced_at', '>=', options.from_date);
      }

      if (options.to_date) {
        query = query.where('synced_at', '<=', options.to_date);
      }

      // Apply ordering
      query = query.orderBy('synced_at', 'desc');

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const logs = await query;

      return logs.map(log => ({
        ...log,
        sync_data: log.sync_data ? JSON.parse(log.sync_data) : null
      }));
    } catch (error) {
      logger.error('Error getting METRC sync history:', error);
      throw error;
    }
  }

  /**
   * Store METRC plant data
   */
  async storePlantData(facilityId, plants) {
    try {
      return await this.transaction(async (trx) => {
        const results = [];

        for (const plant of plants) {
          // Check if plant already exists
          const existingPlant = await trx('metrc_plants')
            .where('metrc_id', plant.Id)
            .where('facility_id', facilityId)
            .first();

          const plantData = {
            facility_id: facilityId,
            metrc_id: plant.Id,
            label: plant.Label,
            state: plant.State,
            growth_phase: plant.GrowthPhase,
            plant_batch_name: plant.PlantBatchName,
            plant_batch_type: plant.PlantBatchType,
            location_name: plant.LocationName,
            strain_name: plant.StrainName,
            planted_date: plant.PlantedDate,
            vegetative_date: plant.VegetativeDate,
            flowering_date: plant.FloweringDate,
            harvested_date: plant.HarvestedDate,
            destroyed_date: plant.DestroyedDate,
            destroyed_note: plant.DestroyedNote,
            last_modified: plant.LastModified,
            metrc_data: JSON.stringify(plant),
            updated_at: new Date()
          };

          if (existingPlant) {
            await trx('metrc_plants')
              .where('id', existingPlant.id)
              .update(plantData);
            results.push({ action: 'updated', plant_id: existingPlant.id });
          } else {
            const [newPlant] = await trx('metrc_plants')
              .insert({ ...plantData, created_at: new Date() })
              .returning('id');
            results.push({ action: 'created', plant_id: newPlant.id || newPlant });
          }
        }

        logger.info(`Stored ${plants.length} METRC plants for facility ${facilityId}`);
        return results;
      });
    } catch (error) {
      logger.error('Error storing METRC plant data:', error);
      throw error;
    }
  }

  /**
   * Store METRC harvest data
   */
  async storeHarvestData(facilityId, harvests) {
    try {
      return await this.transaction(async (trx) => {
        const results = [];

        for (const harvest of harvests) {
          // Check if harvest already exists
          const existingHarvest = await trx('metrc_harvests')
            .where('metrc_id', harvest.Id)
            .where('facility_id', facilityId)
            .first();

          const harvestData = {
            facility_id: facilityId,
            metrc_id: harvest.Id,
            name: harvest.Name,
            harvest_type: harvest.HarvestType,
            drying_location_name: harvest.DryingLocationName,
            patient_license_number: harvest.PatientLicenseNumber,
            actual_date: harvest.ActualDate,
            gross_weight: harvest.GrossWeight,
            gross_unit_of_weight: harvest.GrossUnitOfWeight,
            total_waste_weight: harvest.TotalWasteWeight,
            total_waste_unit_of_weight: harvest.TotalWasteUnitOfWeight,
            total_wet_weight: harvest.TotalWetWeight,
            total_wet_unit_of_weight: harvest.TotalWetUnitOfWeight,
            is_finished: harvest.IsFinished,
            last_modified: harvest.LastModified,
            metrc_data: JSON.stringify(harvest),
            updated_at: new Date()
          };

          if (existingHarvest) {
            await trx('metrc_harvests')
              .where('id', existingHarvest.id)
              .update(harvestData);
            results.push({ action: 'updated', harvest_id: existingHarvest.id });
          } else {
            const [newHarvest] = await trx('metrc_harvests')
              .insert({ ...harvestData, created_at: new Date() })
              .returning('id');
            results.push({ action: 'created', harvest_id: newHarvest.id || newHarvest });
          }
        }

        logger.info(`Stored ${harvests.length} METRC harvests for facility ${facilityId}`);
        return results;
      });
    } catch (error) {
      logger.error('Error storing METRC harvest data:', error);
      throw error;
    }
  }

  /**
   * Store METRC package data
   */
  async storePackageData(facilityId, packages) {
    try {
      return await this.transaction(async (trx) => {
        const results = [];

        for (const pkg of packages) {
          // Check if package already exists
          const existingPackage = await trx('metrc_packages')
            .where('metrc_id', pkg.Id)
            .where('facility_id', facilityId)
            .first();

          const packageData = {
            facility_id: facilityId,
            metrc_id: pkg.Id,
            label: pkg.Label,
            package_type: pkg.PackageType,
            location_name: pkg.LocationName,
            quantity: pkg.Quantity,
            unit_of_measure: pkg.UnitOfMeasure,
            packaged_date: pkg.PackagedDate,
            last_modified: pkg.LastModified,
            item_name: pkg.Item?.Name,
            item_product_category_name: pkg.Item?.ProductCategoryName,
            item_strain_name: pkg.Item?.StrainName,
            is_finished: pkg.IsFinished,
            is_in_transit: pkg.IsInTransit,
            metrc_data: JSON.stringify(pkg),
            updated_at: new Date()
          };

          if (existingPackage) {
            await trx('metrc_packages')
              .where('id', existingPackage.id)
              .update(packageData);
            results.push({ action: 'updated', package_id: existingPackage.id });
          } else {
            const [newPackage] = await trx('metrc_packages')
              .insert({ ...packageData, created_at: new Date() })
              .returning('id');
            results.push({ action: 'created', package_id: newPackage.id || newPackage });
          }
        }

        logger.info(`Stored ${packages.length} METRC packages for facility ${facilityId}`);
        return results;
      });
    } catch (error) {
      logger.error('Error storing METRC package data:', error);
      throw error;
    }
  }

  /**
   * Get METRC plants for a facility
   */
  async getMetrcPlants(facilityId, options = {}) {
    try {
      let query = this.db('metrc_plants')
        .where('facility_id', facilityId);

      // Apply filters
      if (options.state) {
        query = query.where('state', options.state);
      }

      if (options.growth_phase) {
        query = query.where('growth_phase', options.growth_phase);
      }

      if (options.strain_name) {
        query = query.where('strain_name', 'ilike', `%${options.strain_name}%`);
      }

      if (options.location_name) {
        query = query.where('location_name', 'ilike', `%${options.location_name}%`);
      }

      // Apply ordering
      query = query.orderBy('last_modified', 'desc');

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const plants = await query;

      return plants.map(plant => ({
        ...plant,
        metrc_data: plant.metrc_data ? JSON.parse(plant.metrc_data) : null
      }));
    } catch (error) {
      logger.error('Error getting METRC plants:', error);
      throw error;
    }
  }

  /**
   * Get METRC harvests for a facility
   */
  async getMetrcHarvests(facilityId, options = {}) {
    try {
      let query = this.db('metrc_harvests')
        .where('facility_id', facilityId);

      // Apply filters
      if (options.harvest_type) {
        query = query.where('harvest_type', options.harvest_type);
      }

      if (options.is_finished !== undefined) {
        query = query.where('is_finished', options.is_finished);
      }

      // Apply ordering
      query = query.orderBy('actual_date', 'desc');

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const harvests = await query;

      return harvests.map(harvest => ({
        ...harvest,
        metrc_data: harvest.metrc_data ? JSON.parse(harvest.metrc_data) : null
      }));
    } catch (error) {
      logger.error('Error getting METRC harvests:', error);
      throw error;
    }
  }

  /**
   * Get METRC packages for a facility
   */
  async getMetrcPackages(facilityId, options = {}) {
    try {
      let query = this.db('metrc_packages')
        .where('facility_id', facilityId);

      // Apply filters
      if (options.package_type) {
        query = query.where('package_type', options.package_type);
      }

      if (options.is_finished !== undefined) {
        query = query.where('is_finished', options.is_finished);
      }

      if (options.is_in_transit !== undefined) {
        query = query.where('is_in_transit', options.is_in_transit);
      }

      if (options.item_name) {
        query = query.where('item_name', 'ilike', `%${options.item_name}%`);
      }

      // Apply ordering
      query = query.orderBy('packaged_date', 'desc');

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const packages = await query;

      return packages.map(pkg => ({
        ...pkg,
        metrc_data: pkg.metrc_data ? JSON.parse(pkg.metrc_data) : null
      }));
    } catch (error) {
      logger.error('Error getting METRC packages:', error);
      throw error;
    }
  }

  /**
   * Get METRC sync statistics
   */
  async getSyncStats(facilityId, days = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const stats = await this.db(this.tableName)
        .select('sync_type')
        .count('* as count')
        .sum(this.db.raw("CASE WHEN status = 'success' THEN 1 ELSE 0 END as success_count"))
        .sum(this.db.raw("CASE WHEN status = 'error' THEN 1 ELSE 0 END as error_count"))
        .where('facility_id', facilityId)
        .where('synced_at', '>=', fromDate)
        .groupBy('sync_type');

      const totalStats = await this.db(this.tableName)
        .count('* as total_syncs')
        .sum(this.db.raw("CASE WHEN status = 'success' THEN 1 ELSE 0 END as total_success"))
        .sum(this.db.raw("CASE WHEN status = 'error' THEN 1 ELSE 0 END as total_errors"))
        .where('facility_id', facilityId)
        .where('synced_at', '>=', fromDate)
        .first();

      return {
        by_type: stats.map(stat => ({
          sync_type: stat.sync_type,
          total: parseInt(stat.count),
          success: parseInt(stat.success_count),
          errors: parseInt(stat.error_count)
        })),
        totals: {
          total_syncs: parseInt(totalStats.total_syncs),
          total_success: parseInt(totalStats.total_success),
          total_errors: parseInt(totalStats.total_errors)
        }
      };
    } catch (error) {
      logger.error('Error getting METRC sync stats:', error);
      throw error;
    }
  }
}

module.exports = new Metrc();