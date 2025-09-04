/**
 * Environmental Model
 * Handles environmental data, alerts, and monitoring operations
 */

const BaseModel = require('./BaseModel');

class Environmental extends BaseModel {
  static get tableName() {
    return 'environmental_data';
  }

  /**
   * Record environmental data point
   */
  static async recordData(facilityId, roomId, sensorData, userId = null) {
    try {
      const dataPoint = await this.query().insert({
        facility_id: facilityId,
        room_id: roomId,
        sensor_type: sensorData.sensor_type,
        sensor_id: sensorData.sensor_id,
        integration_source: sensorData.integration_source || 'manual',
        value: sensorData.value,
        unit: sensorData.unit,
        recorded_at: sensorData.recorded_at || new Date(),
        metadata: sensorData.metadata || {}
      });

      // Check for alert conditions
      await this.checkAlertConditions(facilityId, roomId, sensorData);

      return dataPoint;
    } catch (error) {
      throw new Error(`Failed to record environmental data: ${error.message}`);
    }
  }

  /**
   * Get environmental data for a room with time range
   */
  static async getRoomData(roomId, sensorType = null, startDate = null, endDate = null, limit = 1000) {
    try {
      let query = this.query()
        .where('room_id', roomId)
        .orderBy('recorded_at', 'desc')
        .limit(limit);

      if (sensorType) {
        query = query.where('sensor_type', sensorType);
      }

      if (startDate) {
        query = query.where('recorded_at', '>=', startDate);
      }

      if (endDate) {
        query = query.where('recorded_at', '<=', endDate);
      }

      return await query;
    } catch (error) {
      throw new Error(`Failed to get room environmental data: ${error.message}`);
    }
  }

  /**
   * Get latest readings for all sensors in a room
   */
  static async getLatestRoomReadings(roomId) {
    try {
      const readings = await this.query()
        .select('sensor_type', 'sensor_id', 'value', 'unit', 'recorded_at', 'integration_source')
        .where('room_id', roomId)
        .whereIn('id', function() {
          this.select(this.raw('MAX(id)'))
            .from('environmental_data')
            .where('room_id', roomId)
            .groupBy('sensor_type', 'sensor_id');
        })
        .orderBy('sensor_type');

      return readings;
    } catch (error) {
      throw new Error(`Failed to get latest room readings: ${error.message}`);
    }
  }

  /**
   * Get environmental statistics for a room
   */
  static async getRoomStats(roomId, sensorType, hours = 24) {
    try {
      const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const stats = await this.query()
        .select(
          this.raw('AVG(value) as avg_value'),
          this.raw('MIN(value) as min_value'),
          this.raw('MAX(value) as max_value'),
          this.raw('COUNT(*) as reading_count')
        )
        .where('room_id', roomId)
        .where('sensor_type', sensorType)
        .where('recorded_at', '>=', startTime)
        .first();

      return {
        ...stats,
        avg_value: parseFloat(stats.avg_value || 0),
        min_value: parseFloat(stats.min_value || 0),
        max_value: parseFloat(stats.max_value || 0),
        reading_count: parseInt(stats.reading_count || 0)
      };
    } catch (error) {
      throw new Error(`Failed to get room statistics: ${error.message}`);
    }
  }

  /**
   * Get facility-wide environmental overview
   */
  static async getFacilityOverview(facilityId) {
    try {
      const overview = await this.query()
        .select('room_id', 'sensor_type', 'value', 'unit', 'recorded_at')
        .where('facility_id', facilityId)
        .whereIn('id', function() {
          this.select(this.raw('MAX(id)'))
            .from('environmental_data')
            .where('facility_id', facilityId)
            .groupBy('room_id', 'sensor_type');
        })
        .orderBy('room_id')
        .orderBy('sensor_type');

      // Group by room
      const roomData = {};
      overview.forEach(reading => {
        if (!roomData[reading.room_id]) {
          roomData[reading.room_id] = {};
        }
        roomData[reading.room_id][reading.sensor_type] = {
          value: reading.value,
          unit: reading.unit,
          recorded_at: reading.recorded_at
        };
      });

      return roomData;
    } catch (error) {
      throw new Error(`Failed to get facility overview: ${error.message}`);
    }
  }

  /**
   * Check alert conditions for environmental data
   */
  static async checkAlertConditions(facilityId, roomId, sensorData) {
    try {
      // Get room configuration for alert thresholds
      const room = await this.knex('rooms')
        .where('id', roomId)
        .first();

      if (!room || !room.environmental_settings) {
        return;
      }

      const settings = room.environmental_settings;
      const sensorType = sensorData.sensor_type;
      const value = parseFloat(sensorData.value);

      if (!settings[sensorType]) {
        return;
      }

      const thresholds = settings[sensorType];
      let alertType = null;
      let severity = 'info';
      let message = '';

      // Check critical thresholds
      if (thresholds.critical_min !== undefined && value < thresholds.critical_min) {
        alertType = 'critical_low';
        severity = 'critical';
        message = `${sensorType} critically low: ${value}${sensorData.unit} (min: ${thresholds.critical_min}${sensorData.unit})`;
      } else if (thresholds.critical_max !== undefined && value > thresholds.critical_max) {
        alertType = 'critical_high';
        severity = 'critical';
        message = `${sensorType} critically high: ${value}${sensorData.unit} (max: ${thresholds.critical_max}${sensorData.unit})`;
      }
      // Check warning thresholds
      else if (thresholds.warning_min !== undefined && value < thresholds.warning_min) {
        alertType = 'warning_low';
        severity = 'warning';
        message = `${sensorType} below optimal: ${value}${sensorData.unit} (min: ${thresholds.warning_min}${sensorData.unit})`;
      } else if (thresholds.warning_max !== undefined && value > thresholds.warning_max) {
        alertType = 'warning_high';
        severity = 'warning';
        message = `${sensorType} above optimal: ${value}${sensorData.unit} (max: ${thresholds.warning_max}${sensorData.unit})`;
      }

      // Create alert if threshold exceeded
      if (alertType) {
        await this.createAlert(facilityId, roomId, {
          alert_type: 'environmental',
          severity: severity,
          title: `${sensorType.toUpperCase()} Alert - Room ${room.name}`,
          message: message,
          source: sensorData.integration_source || 'system',
          alert_data: {
            sensor_type: sensorType,
            sensor_id: sensorData.sensor_id,
            value: value,
            unit: sensorData.unit,
            threshold_type: alertType,
            thresholds: thresholds
          }
        });
      }
    } catch (error) {
      console.error('Error checking alert conditions:', error);
    }
  }

  /**
   * Create environmental alert
   */
  static async createAlert(facilityId, roomId, alertData) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await this.knex('alerts')
        .where('facility_id', facilityId)
        .where('room_id', roomId)
        .where('alert_type', alertData.alert_type)
        .where('status', 'active')
        .whereRaw("alert_data->>'sensor_type' = ?", [alertData.alert_data.sensor_type])
        .whereRaw("alert_data->>'threshold_type' = ?", [alertData.alert_data.threshold_type])
        .first();

      if (existingAlert) {
        // Update existing alert with new data
        await this.knex('alerts')
          .where('id', existingAlert.id)
          .update({
            message: alertData.message,
            alert_data: alertData.alert_data,
            triggered_at: new Date(),
            updated_at: new Date()
          });
        return existingAlert;
      } else {
        // Create new alert
        const alert = await this.knex('alerts').insert({
          facility_id: facilityId,
          room_id: roomId,
          ...alertData,
          triggered_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }).returning('*');

        return alert[0];
      }
    } catch (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  /**
   * Get active alerts for facility
   */
  static async getActiveAlerts(facilityId, roomId = null) {
    try {
      let query = this.knex('alerts')
        .where('facility_id', facilityId)
        .where('status', 'active')
        .orderBy('severity', 'desc')
        .orderBy('triggered_at', 'desc');

      if (roomId) {
        query = query.where('room_id', roomId);
      }

      return await query;
    } catch (error) {
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  }

  /**
   * Acknowledge alert
   */
  static async acknowledgeAlert(alertId, userId, notes = null) {
    try {
      const alert = await this.knex('alerts')
        .where('id', alertId)
        .update({
          status: 'acknowledged',
          acknowledged_by_user_id: userId,
          acknowledged_at: new Date(),
          resolution_notes: notes,
          updated_at: new Date()
        })
        .returning('*');

      return alert[0];
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  /**
   * Resolve alert
   */
  static async resolveAlert(alertId, userId, notes = null) {
    try {
      const alert = await this.knex('alerts')
        .where('id', alertId)
        .update({
          status: 'resolved',
          resolved_by_user_id: userId,
          resolved_at: new Date(),
          resolution_notes: notes,
          updated_at: new Date()
        })
        .returning('*');

      return alert[0];
    } catch (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  }

  /**
   * Get environmental trends for analytics
   */
  static async getTrends(roomId, sensorType, days = 7) {
    try {
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      
      const trends = await this.query()
        .select(
          this.raw("DATE_TRUNC('hour', recorded_at) as hour"),
          this.raw('AVG(value) as avg_value'),
          this.raw('MIN(value) as min_value'),
          this.raw('MAX(value) as max_value')
        )
        .where('room_id', roomId)
        .where('sensor_type', sensorType)
        .where('recorded_at', '>=', startDate)
        .groupBy(this.raw("DATE_TRUNC('hour', recorded_at)"))
        .orderBy('hour');

      return trends.map(trend => ({
        ...trend,
        avg_value: parseFloat(trend.avg_value),
        min_value: parseFloat(trend.min_value),
        max_value: parseFloat(trend.max_value)
      }));
    } catch (error) {
      throw new Error(`Failed to get environmental trends: ${error.message}`);
    }
  }

  /**
   * Bulk insert environmental data (for integration imports)
   */
  static async bulkInsertData(dataPoints) {
    try {
      const batchSize = 1000;
      const results = [];

      for (let i = 0; i < dataPoints.length; i += batchSize) {
        const batch = dataPoints.slice(i, i + batchSize);
        const inserted = await this.query().insert(batch);
        results.push(...inserted);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to bulk insert environmental data: ${error.message}`);
    }
  }
}

module.exports = Environmental;