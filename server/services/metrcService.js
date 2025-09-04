const axios = require('axios');
const logger = require('../utils/logger');

/**
 * METRC API Integration Service
 * Handles all communication with the METRC state tracking system
 */
class MetrcService {
  constructor() {
    this.baseURL = process.env.METRC_BASE_URL || 'https://api-or.metrc.com';
    this.softwareApiKey = process.env.METRC_SOFTWARE_API_KEY;
    this.defaultTimeout = 30000; // 30 seconds
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication header if API keys are available
        if (this.softwareApiKey && config.userApiKey) {
          const credentials = `${this.softwareApiKey}:${config.userApiKey}`;
          const encodedCredentials = Buffer.from(credentials).toString('base64');
          config.headers.Authorization = `Basic ${encodedCredentials}`;
          
          // Remove userApiKey from config to avoid sending it in the request
          delete config.userApiKey;
        }
        
        logger.info(`METRC API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('METRC API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`METRC API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        const errorMessage = this.formatError(error);
        logger.error('METRC API Error:', errorMessage);
        throw new Error(errorMessage);
      }
    );
  }

  /**
   * Format error messages from METRC API responses
   */
  formatError(error) {
    if (error.response) {
      const { status, data } = error.response;
      if (data && data.Message) {
        return `METRC API Error (${status}): ${data.Message}`;
      }
      if (data && typeof data === 'string') {
        return `METRC API Error (${status}): ${data}`;
      }
      return `METRC API Error (${status}): ${error.message}`;
    }
    
    if (error.request) {
      return `METRC API Network Error: ${error.message}`;
    }
    
    return `METRC API Error: ${error.message}`;
  }

  /**
   * Format date for METRC API (ISO 8601 format)
   */
  formatDate(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Format datetime for METRC API (ISO 8601 format with timezone)
   */
  formatDateTime(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    return d.toISOString(); // Full ISO 8601 format
  }

  // ==================== FACILITIES ====================

  /**
   * Get all facilities for the user
   */
  async getFacilities(userApiKey) {
    try {
      const response = await this.client.get('/facilities/v2', {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching facilities:', error);
      throw error;
    }
  }

  // ==================== PLANTS ====================

  /**
   * Get all plants for a facility
   */
  async getPlants(userApiKey, facilityLicense, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.lastModifiedStart) {
        params.append('lastModifiedStart', this.formatDateTime(options.lastModifiedStart));
      }
      if (options.lastModifiedEnd) {
        params.append('lastModifiedEnd', this.formatDateTime(options.lastModifiedEnd));
      }

      const url = `/plants/v2/${facilityLicense}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await this.client.get(url, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching plants:', error);
      throw error;
    }
  }

  /**
   * Get plants by ID
   */
  async getPlantsById(userApiKey, facilityLicense, plantIds) {
    try {
      const response = await this.client.post(`/plants/v2/${facilityLicense}`, plantIds, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching plants by ID:', error);
      throw error;
    }
  }

  /**
   * Create plant batches from seeds
   */
  async createPlantBatchesFromSeeds(userApiKey, facilityLicense, batches) {
    try {
      const response = await this.client.post(
        `/plants/v2/createplantings/${facilityLicense}`,
        batches,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating plant batches from seeds:', error);
      throw error;
    }
  }

  /**
   * Create plant batches from clones
   */
  async createPlantBatchesFromClones(userApiKey, facilityLicense, batches) {
    try {
      const response = await this.client.post(
        `/plants/v2/createplantbatchfromclones/${facilityLicense}`,
        batches,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating plant batches from clones:', error);
      throw error;
    }
  }

  /**
   * Change plant growth phases
   */
  async changePlantGrowthPhases(userApiKey, facilityLicense, changes) {
    try {
      const response = await this.client.post(
        `/plants/v2/changegrowthphases/${facilityLicense}`,
        changes,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error changing plant growth phases:', error);
      throw error;
    }
  }

  /**
   * Move plants
   */
  async movePlants(userApiKey, facilityLicense, moves) {
    try {
      const response = await this.client.post(
        `/plants/v2/moveplants/${facilityLicense}`,
        moves,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error moving plants:', error);
      throw error;
    }
  }

  /**
   * Destroy plants
   */
  async destroyPlants(userApiKey, facilityLicense, destructions) {
    try {
      const response = await this.client.post(
        `/plants/v2/destroyplants/${facilityLicense}`,
        destructions,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error destroying plants:', error);
      throw error;
    }
  }

  // ==================== HARVESTS ====================

  /**
   * Get harvests for a facility
   */
  async getHarvests(userApiKey, facilityLicense, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.lastModifiedStart) {
        params.append('lastModifiedStart', this.formatDateTime(options.lastModifiedStart));
      }
      if (options.lastModifiedEnd) {
        params.append('lastModifiedEnd', this.formatDateTime(options.lastModifiedEnd));
      }

      const url = `/harvests/v2/${facilityLicense}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await this.client.get(url, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching harvests:', error);
      throw error;
    }
  }

  /**
   * Create harvest
   */
  async createHarvest(userApiKey, facilityLicense, harvests) {
    try {
      const response = await this.client.post(
        `/harvests/v2/create/${facilityLicense}`,
        harvests,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating harvest:', error);
      throw error;
    }
  }

  /**
   * Remove waste from harvest
   */
  async removeWasteFromHarvest(userApiKey, facilityLicense, removals) {
    try {
      const response = await this.client.post(
        `/harvests/v2/removewaste/${facilityLicense}`,
        removals,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error removing waste from harvest:', error);
      throw error;
    }
  }

  // ==================== PACKAGES ====================

  /**
   * Get packages for a facility
   */
  async getPackages(userApiKey, facilityLicense, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.lastModifiedStart) {
        params.append('lastModifiedStart', this.formatDateTime(options.lastModifiedStart));
      }
      if (options.lastModifiedEnd) {
        params.append('lastModifiedEnd', this.formatDateTime(options.lastModifiedEnd));
      }

      const url = `/packages/v2/${facilityLicense}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await this.client.get(url, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching packages:', error);
      throw error;
    }
  }

  /**
   * Create packages from harvest
   */
  async createPackagesFromHarvest(userApiKey, facilityLicense, packages) {
    try {
      const response = await this.client.post(
        `/packages/v2/create/${facilityLicense}`,
        packages,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating packages from harvest:', error);
      throw error;
    }
  }

  /**
   * Adjust package inventory
   */
  async adjustPackageInventory(userApiKey, facilityLicense, adjustments) {
    try {
      const response = await this.client.post(
        `/packages/v2/adjust/${facilityLicense}`,
        adjustments,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error adjusting package inventory:', error);
      throw error;
    }
  }

  // ==================== ITEMS ====================

  /**
   * Get items for a facility
   */
  async getItems(userApiKey, facilityLicense) {
    try {
      const response = await this.client.get(`/items/v2/${facilityLicense}`, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching items:', error);
      throw error;
    }
  }

  /**
   * Create items
   */
  async createItems(userApiKey, facilityLicense, items) {
    try {
      const response = await this.client.post(
        `/items/v2/create/${facilityLicense}`,
        items,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating items:', error);
      throw error;
    }
  }

  // ==================== STRAINS ====================

  /**
   * Get strains for a facility
   */
  async getStrains(userApiKey, facilityLicense) {
    try {
      const response = await this.client.get(`/strains/v2/${facilityLicense}`, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching strains:', error);
      throw error;
    }
  }

  /**
   * Create strains
   */
  async createStrains(userApiKey, facilityLicense, strains) {
    try {
      const response = await this.client.post(
        `/strains/v2/create/${facilityLicense}`,
        strains,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating strains:', error);
      throw error;
    }
  }

  // ==================== LOCATIONS ====================

  /**
   * Get locations for a facility
   */
  async getLocations(userApiKey, facilityLicense) {
    try {
      const response = await this.client.get(`/locations/v2/${facilityLicense}`, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching locations:', error);
      throw error;
    }
  }

  /**
   * Create locations
   */
  async createLocations(userApiKey, facilityLicense, locations) {
    try {
      const response = await this.client.post(
        `/locations/v2/create/${facilityLicense}`,
        locations,
        { userApiKey }
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating locations:', error);
      throw error;
    }
  }

  // ==================== TRANSFERS ====================

  /**
   * Get incoming transfers
   */
  async getIncomingTransfers(userApiKey, facilityLicense) {
    try {
      const response = await this.client.get(`/transfers/v2/incoming/${facilityLicense}`, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching incoming transfers:', error);
      throw error;
    }
  }

  /**
   * Get outgoing transfers
   */
  async getOutgoingTransfers(userApiKey, facilityLicense) {
    try {
      const response = await this.client.get(`/transfers/v2/outgoing/${facilityLicense}`, {
        userApiKey
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching outgoing transfers:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Test connection to METRC API
   */
  async testConnection(userApiKey) {
    try {
      const facilities = await this.getFacilities(userApiKey);
      logger.info('METRC connection test successful');
      return {
        success: true,
        message: 'Connection successful',
        facilitiesCount: facilities ? facilities.length : 0
      };
    } catch (error) {
      logger.error('METRC connection test failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Sync data from METRC to local database
   */
  async syncData(userApiKey, facilityLicense, options = {}) {
    try {
      const syncResults = {
        plants: 0,
        harvests: 0,
        packages: 0,
        items: 0,
        strains: 0,
        locations: 0,
        errors: []
      };

      // Sync plants
      if (options.syncPlants !== false) {
        try {
          const plants = await this.getPlants(userApiKey, facilityLicense, options);
          syncResults.plants = plants ? plants.length : 0;
          logger.info(`Synced ${syncResults.plants} plants from METRC`);
        } catch (error) {
          syncResults.errors.push(`Plants sync error: ${error.message}`);
        }
      }

      // Sync harvests
      if (options.syncHarvests !== false) {
        try {
          const harvests = await this.getHarvests(userApiKey, facilityLicense, options);
          syncResults.harvests = harvests ? harvests.length : 0;
          logger.info(`Synced ${syncResults.harvests} harvests from METRC`);
        } catch (error) {
          syncResults.errors.push(`Harvests sync error: ${error.message}`);
        }
      }

      // Sync packages
      if (options.syncPackages !== false) {
        try {
          const packages = await this.getPackages(userApiKey, facilityLicense, options);
          syncResults.packages = packages ? packages.length : 0;
          logger.info(`Synced ${syncResults.packages} packages from METRC`);
        } catch (error) {
          syncResults.errors.push(`Packages sync error: ${error.message}`);
        }
      }

      // Sync items
      if (options.syncItems !== false) {
        try {
          const items = await this.getItems(userApiKey, facilityLicense);
          syncResults.items = items ? items.length : 0;
          logger.info(`Synced ${syncResults.items} items from METRC`);
        } catch (error) {
          syncResults.errors.push(`Items sync error: ${error.message}`);
        }
      }

      // Sync strains
      if (options.syncStrains !== false) {
        try {
          const strains = await this.getStrains(userApiKey, facilityLicense);
          syncResults.strains = strains ? strains.length : 0;
          logger.info(`Synced ${syncResults.strains} strains from METRC`);
        } catch (error) {
          syncResults.errors.push(`Strains sync error: ${error.message}`);
        }
      }

      // Sync locations
      if (options.syncLocations !== false) {
        try {
          const locations = await this.getLocations(userApiKey, facilityLicense);
          syncResults.locations = locations ? locations.length : 0;
          logger.info(`Synced ${syncResults.locations} locations from METRC`);
        } catch (error) {
          syncResults.errors.push(`Locations sync error: ${error.message}`);
        }
      }

      return syncResults;
    } catch (error) {
      logger.error('Error during METRC sync:', error);
      throw error;
    }
  }
}

module.exports = new MetrcService();