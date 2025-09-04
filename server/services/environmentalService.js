/**
 * Environmental Service
 * Handles integration with environmental monitoring systems
 */

const Environmental = require('../models/Environmental');
const logger = require('../utils/logger');

class EnvironmentalService {
  constructor() {
    this.integrations = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize environmental service
   */
  async initialize() {
    try {
      logger.info('Initializing Environmental Service...');
      
      // Load active integrations from database
      await this.loadIntegrations();
      
      // Start monitoring loop
      this.startMonitoring();
      
      this.isRunning = true;
      logger.info('Environmental Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Environmental Service:', error);
      throw error;
    }
  }

  /**
   * Load active integrations from database
   */
  async loadIntegrations() {
    try {
      const integrations = await this.knex('integrations')
        .where('is_active', true)
        .whereIn('integration_type', ['growlink', 'altequa', 'dositron']);

      for (const integration of integrations) {
        this.integrations.set(integration.id, {
          ...integration,
          lastSync: integration.last_sync,
          status: integration.status
        });
      }

      logger.info(`Loaded ${integrations.length} environmental integrations`);
    } catch (error) {
      logger.error('Error loading integrations:', error);
    }
  }

  /**
   * Start monitoring loop
   */
  startMonitoring() {
    // Monitor every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.syncAllIntegrations();
    }, 5 * 60 * 1000);

    logger.info('Environmental monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    logger.info('Environmental monitoring stopped');
  }

  /**
   * Sync all active integrations
   */
  async syncAllIntegrations() {
    try {
      const promises = Array.from(this.integrations.values()).map(integration => 
        this.syncIntegration(integration)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Error syncing integrations:', error);
    }
  }

  /**
   * Sync individual integration
   */
  async syncIntegration(integration) {
    try {
      logger.debug(`Syncing integration: ${integration.name} (${integration.integration_type})`);

      switch (integration.integration_type) {
        case 'growlink':
          await this.syncGrowlink(integration);
          break;
        case 'altequa':
          await this.syncAltequa(integration);
          break;
        case 'dositron':
          await this.syncDositron(integration);
          break;
        default:
          logger.warn(`Unknown integration type: ${integration.integration_type}`);
      }

      // Update last sync time
      await this.updateIntegrationSync(integration.id, 'success');
    } catch (error) {
      logger.error(`Error syncing ${integration.name}:`, error);
      await this.updateIntegrationSync(integration.id, 'error', error.message);
    }
  }

  /**
   * Sync Growlink data
   */
  async syncGrowlink(integration) {
    // Placeholder for Growlink API integration
    // This would connect to Growlink API and fetch sensor data
    logger.debug('Growlink sync - placeholder implementation');
    
    // Example of what this would do:
    // 1. Connect to Growlink API
    // 2. Fetch sensor readings for all rooms
    // 3. Store data in environmental_data table
    // 4. Check for alert conditions
    
    // For now, generate some mock data for testing
    if (process.env.NODE_ENV === 'development') {
      await this.generateMockData(integration.facility_id, 'growlink');
    }
  }

  /**
   * Sync Altequa HVAC data
   */
  async syncAltequa(integration) {
    // Placeholder for Altequa API integration
    logger.debug('Altequa sync - placeholder implementation');
    
    // Example implementation:
    // 1. Connect to Altequa HVAC system
    // 2. Fetch temperature, humidity, and system status
    // 3. Store environmental data
    // 4. Monitor for equipment alerts
    
    if (process.env.NODE_ENV === 'development') {
      await this.generateMockData(integration.facility_id, 'altequa');
    }
  }

  /**
   * Sync Dositron irrigation data
   */
  async syncDositron(integration) {
    // Placeholder for Dositron integration
    logger.debug('Dositron sync - placeholder implementation');
    
    // Example implementation:
    // 1. Connect to Dositron system (may require hardware interface)
    // 2. Fetch pH, EC, nutrient levels
    // 3. Store irrigation data
    // 4. Monitor for dosing alerts
    
    if (process.env.NODE_ENV === 'development') {
      await this.generateMockData(integration.facility_id, 'dositron');
    }
  }

  /**
   * Generate mock environmental data for development
   */
  async generateMockData(facilityId, source) {
    try {
      // Get rooms for this facility
      const rooms = await this.knex('rooms')
        .where('facility_id', facilityId)
        .where('is_active', true);

      const dataPoints = [];
      const now = new Date();

      for (const room of rooms) {
        // Generate different sensor data based on source
        if (source === 'growlink') {
          // Temperature, humidity, CO2, light
          dataPoints.push(
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'temperature',
              sensor_id: `temp_${room.id}_01`,
              integration_source: source,
              value: 72 + Math.random() * 8, // 72-80°F
              unit: '°F',
              recorded_at: now,
              metadata: { room_name: room.name }
            },
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'humidity',
              sensor_id: `hum_${room.id}_01`,
              integration_source: source,
              value: 50 + Math.random() * 20, // 50-70%
              unit: '%',
              recorded_at: now,
              metadata: { room_name: room.name }
            },
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'co2',
              sensor_id: `co2_${room.id}_01`,
              integration_source: source,
              value: 800 + Math.random() * 400, // 800-1200 ppm
              unit: 'ppm',
              recorded_at: now,
              metadata: { room_name: room.name }
            }
          );
        } else if (source === 'altequa') {
          // HVAC-specific data
          dataPoints.push(
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'temperature',
              sensor_id: `hvac_temp_${room.id}`,
              integration_source: source,
              value: 73 + Math.random() * 6, // 73-79°F
              unit: '°F',
              recorded_at: now,
              metadata: { system: 'hvac', room_name: room.name }
            },
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'air_flow',
              sensor_id: `hvac_flow_${room.id}`,
              integration_source: source,
              value: 200 + Math.random() * 100, // 200-300 CFM
              unit: 'CFM',
              recorded_at: now,
              metadata: { system: 'hvac', room_name: room.name }
            }
          );
        } else if (source === 'dositron') {
          // Irrigation-specific data
          dataPoints.push(
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'ph',
              sensor_id: `ph_${room.id}_01`,
              integration_source: source,
              value: 5.8 + Math.random() * 0.8, // 5.8-6.6 pH
              unit: 'pH',
              recorded_at: now,
              metadata: { system: 'irrigation', room_name: room.name }
            },
            {
              facility_id: facilityId,
              room_id: room.id,
              sensor_type: 'ec',
              sensor_id: `ec_${room.id}_01`,
              integration_source: source,
              value: 1200 + Math.random() * 400, // 1200-1600 µS/cm
              unit: 'µS/cm',
              recorded_at: now,
              metadata: { system: 'irrigation', room_name: room.name }
            }
          );
        }
      }

      // Bulk insert the data
      if (dataPoints.length > 0) {
        await Environmental.bulkInsertData(dataPoints);
        logger.debug(`Generated ${dataPoints.length} mock data points for ${source}`);
      }
    } catch (error) {
      logger.error(`Error generating mock data for ${source}:`, error);
    }
  }

  /**
   * Update integration sync status
   */
  async updateIntegrationSync(integrationId, status, errorMessage = null) {
    try {
      const updateData = {
        last_sync: new Date(),
        status: status,
        updated_at: new Date()
      };

      if (status === 'error' && errorMessage) {
        // Add error to error log
        const integration = this.integrations.get(integrationId);
        const errorLog = integration?.error_log || [];
        errorLog.push({
          timestamp: new Date(),
          error: errorMessage
        });
        
        // Keep only last 10 errors
        updateData.error_log = JSON.stringify(errorLog.slice(-10));
      }

      await this.knex('integrations')
        .where('id', integrationId)
        .update(updateData);

      // Update local cache
      const integration = this.integrations.get(integrationId);
      if (integration) {
        integration.lastSync = updateData.last_sync;
        integration.status = status;
      }
    } catch (error) {
      logger.error('Error updating integration sync status:', error);
    }
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    const status = {
      isRunning: this.isRunning,
      integrations: Array.from(this.integrations.values()).map(integration => ({
        id: integration.id,
        name: integration.name,
        type: integration.integration_type,
        status: integration.status,
        lastSync: integration.lastSync
      }))
    };

    return status;
  }

  /**
   * Manually trigger sync for specific integration
   */
  async triggerSync(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    await this.syncIntegration(integration);
    return { success: true, message: `Sync triggered for ${integration.name}` };
  }

  /**
   * Add new integration
   */
  async addIntegration(integrationData) {
    try {
      const integration = await this.knex('integrations')
        .insert({
          ...integrationData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Add to local cache
      this.integrations.set(integration[0].id, integration[0]);

      logger.info(`Added new integration: ${integration[0].name}`);
      return integration[0];
    } catch (error) {
      logger.error('Error adding integration:', error);
      throw error;
    }
  }

  /**
   * Get database connection
   */
  get knex() {
    return require('../config/database').knex;
  }
}

// Create singleton instance
const environmentalService = new EnvironmentalService();

module.exports = environmentalService;