/**
 * Report Engine Service
 * Core service for data aggregation, report generation, and analytics
 */

const knex = require('../config/database');
const { Report } = require('../models');

class ReportEngine {
  /**
   * CORE REPORT GENERATION
   */

  // Generate report data based on template and parameters
  static async generateReport(reportId, facilityId, parameters = {}) {
    try {
      // Get report configuration
      const report = await Report.getReportById(reportId, facilityId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(reportId, parameters);
      const cachedData = await Report.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Generate report data based on category
      let reportData;
      switch (report.template_category) {
        case 'production':
          reportData = await this.generateProductionReport(report, parameters, facilityId);
          break;
        case 'inventory':
          reportData = await this.generateInventoryReport(report, parameters, facilityId);
          break;
        case 'financial':
          reportData = await this.generateFinancialReport(report, parameters, facilityId);
          break;
        case 'compliance':
          reportData = await this.generateComplianceReport(report, parameters, facilityId);
          break;
        case 'environmental':
          reportData = await this.generateEnvironmentalReport(report, parameters, facilityId);
          break;
        case 'quality':
          reportData = await this.generateQualityReport(report, parameters, facilityId);
          break;
        default:
          reportData = await this.generateCustomReport(report, parameters, facilityId);
      }

      // Apply calculations and formatting
      reportData = await this.applyCalculations(reportData, report.calculations || []);
      reportData = await this.applyFormatting(reportData, report.formatting || {});

      // Cache the results
      await Report.cacheData(cacheKey, report.template_category, parameters, reportData, 60);

      return reportData;
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * PRODUCTION REPORTS
   */

  static async generateProductionReport(report, parameters, facilityId) {
    const { startDate, endDate, strainIds, roomIds, batchIds } = parameters;
    
    try {
      let query = knex('batches')
        .where('batches.facility_id', facilityId);

      // Apply date filters
      if (startDate) query = query.where('batches.start_date', '>=', startDate);
      if (endDate) query = query.where('batches.start_date', '<=', endDate);
      
      // Apply entity filters
      if (strainIds?.length) query = query.whereIn('batches.strain_id', strainIds);
      if (roomIds?.length) query = query.whereIn('batches.room_id', roomIds);
      if (batchIds?.length) query = query.whereIn('batches.id', batchIds);

      const data = await query
        .leftJoin('strains', 'batches.strain_id', 'strains.id')
        .leftJoin('rooms', 'batches.room_id', 'rooms.id')
        .leftJoin('plants', 'batches.id', 'plants.batch_id')
        .select(
          'batches.id',
          'batches.batch_number',
          'batches.batch_name',
          'batches.growth_phase',
          'batches.plant_count',
          'batches.start_date',
          'batches.expected_harvest_date',
          'batches.actual_harvest_date',
          'strains.name as strain_name',
          'strains.strain_type',
          'strains.expected_yield_per_plant',
          'rooms.name as room_name',
          'rooms.room_type',
          knex.raw('SUM(plants.harvest_weight) as total_harvest_weight'),
          knex.raw('AVG(plants.harvest_weight) as avg_plant_weight'),
          knex.raw('COUNT(plants.id) as actual_plant_count')
        )
        .groupBy(
          'batches.id', 'batches.batch_number', 'batches.batch_name',
          'batches.growth_phase', 'batches.plant_count', 'batches.start_date',
          'batches.expected_harvest_date', 'batches.actual_harvest_date',
          'strains.name', 'strains.strain_type', 'strains.expected_yield_per_plant',
          'rooms.name', 'rooms.room_type'
        )
        .orderBy('batches.start_date', 'desc');

      // Calculate additional metrics
      const enrichedData = data.map(batch => ({
        ...batch,
        yield_per_plant: batch.actual_plant_count > 0 ? 
          (batch.total_harvest_weight / batch.actual_plant_count).toFixed(2) : 0,
        expected_vs_actual_yield: batch.expected_yield_per_plant > 0 ?
          ((batch.avg_plant_weight / batch.expected_yield_per_plant) * 100).toFixed(1) : 0,
        days_to_harvest: batch.actual_harvest_date && batch.start_date ?
          Math.ceil((new Date(batch.actual_harvest_date) - new Date(batch.start_date)) / (1000 * 60 * 60 * 24)) : null,
        harvest_efficiency: batch.plant_count > 0 ?
          ((batch.actual_plant_count / batch.plant_count) * 100).toFixed(1) : 0
      }));

      return {
        data: enrichedData,
        summary: await this.calculateProductionSummary(enrichedData),
        chartData: await this.prepareProductionChartData(enrichedData, report.template_type)
      };
    } catch (error) {
      throw new Error(`Failed to generate production report: ${error.message}`);
    }
  }

  /**
   * INVENTORY REPORTS
   */

  static async generateInventoryReport(report, parameters, facilityId) {
    const { categoryIds, supplierIds, lowStockOnly, expiringSoon } = parameters;
    
    try {
      let query = knex('inventory_items')
        .where('inventory_items.facility_id', facilityId)
        .where('inventory_items.is_active', true);

      // Apply filters
      if (categoryIds?.length) query = query.whereIn('inventory_items.category_id', categoryIds);
      if (supplierIds?.length) query = query.whereIn('inventory_items.supplier_id', supplierIds);
      if (lowStockOnly) {
        query = query.whereRaw('inventory_items.available_quantity <= inventory_items.reorder_point');
      }
      if (expiringSoon) {
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        query = query.where('inventory_items.expiration_date', '<=', thirtyDaysFromNow);
      }

      const data = await query
        .leftJoin('inventory_categories', 'inventory_items.category_id', 'inventory_categories.id')
        .leftJoin('suppliers', 'inventory_items.supplier_id', 'suppliers.id')
        .select(
          'inventory_items.*',
          'inventory_categories.name as category_name',
          'inventory_categories.category_type',
          'suppliers.name as supplier_name'
        )
        .orderBy('inventory_items.name');

      // Calculate inventory values and metrics
      const enrichedData = data.map(item => ({
        ...item,
        total_value: (item.current_quantity * item.unit_cost).toFixed(2),
        stock_status: this.getStockStatus(item),
        days_until_expiry: item.expiration_date ? 
          Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        turnover_rate: this.calculateTurnoverRate(item.sku, facilityId) // This would need historical data
      }));

      return {
        data: enrichedData,
        summary: await this.calculateInventorySummary(enrichedData),
        chartData: await this.prepareInventoryChartData(enrichedData, report.template_type)
      };
    } catch (error) {
      throw new Error(`Failed to generate inventory report: ${error.message}`);
    }
  }

  /**
   * FINANCIAL REPORTS
   */

  static async generateFinancialReport(report, parameters, facilityId) {
    const { startDate, endDate, includeProjections } = parameters;
    
    try {
      // Get purchase orders data
      const purchaseData = await knex('purchase_orders')
        .where('facility_id', facilityId)
        .whereBetween('order_date', [startDate, endDate])
        .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
        .select(
          'purchase_orders.*',
          'suppliers.name as supplier_name',
          'suppliers.supplier_type'
        );

      // Get sales orders data
      const salesData = await knex('sales_orders')
        .where('facility_id', facilityId)
        .whereBetween('order_date', [startDate, endDate])
        .leftJoin('clients', 'sales_orders.client_id', 'clients.id')
        .select(
          'sales_orders.*',
          'clients.name as client_name',
          'clients.client_type'
        );

      // Get inventory valuation
      const inventoryValue = await knex('inventory_items')
        .where('facility_id', facilityId)
        .where('is_active', true)
        .sum(knex.raw('current_quantity * unit_cost as total_value'))
        .first();

      // Calculate cost per gram
      const costPerGram = await this.calculateCostPerGram(facilityId, startDate, endDate);

      return {
        purchases: purchaseData,
        sales: salesData,
        inventory_valuation: inventoryValue.total_value || 0,
        cost_per_gram: costPerGram,
        summary: {
          total_purchases: purchaseData.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0),
          total_sales: salesData.reduce((sum, so) => sum + parseFloat(so.total_amount || 0), 0),
          gross_profit: salesData.reduce((sum, so) => sum + parseFloat(so.total_amount || 0), 0) - 
                       purchaseData.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0)
        },
        chartData: await this.prepareFinancialChartData(purchaseData, salesData, report.template_type)
      };
    } catch (error) {
      throw new Error(`Failed to generate financial report: ${error.message}`);
    }
  }

  /**
   * COMPLIANCE REPORTS
   */

  static async generateComplianceReport(report, parameters, facilityId) {
    const { startDate, endDate, eventTypes } = parameters;
    
    try {
      let query = knex('compliance_events')
        .where('facility_id', facilityId);

      if (startDate) query = query.where('event_timestamp', '>=', startDate);
      if (endDate) query = query.where('event_timestamp', '<=', endDate);
      if (eventTypes?.length) query = query.whereIn('event_type', eventTypes);

      const complianceEvents = await query
        .leftJoin('users', 'compliance_events.user_id', 'users.id')
        .select(
          'compliance_events.*',
          'users.first_name',
          'users.last_name'
        )
        .orderBy('compliance_events.event_timestamp', 'desc');

      // Get METRC sync status
      const metrcStatus = await this.getMetrcSyncStatus(facilityId);

      // Get audit trail summary
      const auditSummary = await this.getAuditTrailSummary(facilityId, startDate, endDate);

      return {
        compliance_events: complianceEvents,
        metrc_status: metrcStatus,
        audit_summary: auditSummary,
        summary: {
          total_events: complianceEvents.length,
          pending_events: complianceEvents.filter(e => e.status === 'pending').length,
          failed_events: complianceEvents.filter(e => e.status === 'rejected').length,
          success_rate: complianceEvents.length > 0 ? 
            ((complianceEvents.filter(e => e.status === 'accepted').length / complianceEvents.length) * 100).toFixed(1) : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }
  }

  /**
   * ENVIRONMENTAL REPORTS
   */

  static async generateEnvironmentalReport(report, parameters, facilityId) {
    const { startDate, endDate, roomIds, sensorTypes } = parameters;
    
    try {
      let query = knex('environmental_data')
        .where('facility_id', facilityId);

      if (startDate) query = query.where('recorded_at', '>=', startDate);
      if (endDate) query = query.where('recorded_at', '<=', endDate);
      if (roomIds?.length) query = query.whereIn('room_id', roomIds);
      if (sensorTypes?.length) query = query.whereIn('sensor_type', sensorTypes);

      const environmentalData = await query
        .leftJoin('rooms', 'environmental_data.room_id', 'rooms.id')
        .select(
          'environmental_data.*',
          'rooms.name as room_name',
          'rooms.room_type'
        )
        .orderBy('environmental_data.recorded_at', 'desc');

      // Calculate averages and trends
      const summary = await this.calculateEnvironmentalSummary(environmentalData);
      
      // Get alerts in the same period
      const alerts = await knex('alerts')
        .where('facility_id', facilityId)
        .where('alert_type', 'environmental')
        .whereBetween('triggered_at', [startDate, endDate])
        .leftJoin('rooms', 'alerts.room_id', 'rooms.id')
        .select('alerts.*', 'rooms.name as room_name');

      return {
        environmental_data: environmentalData,
        alerts: alerts,
        summary: summary,
        chartData: await this.prepareEnvironmentalChartData(environmentalData, report.template_type)
      };
    } catch (error) {
      throw new Error(`Failed to generate environmental report: ${error.message}`);
    }
  }

  /**
   * QUALITY REPORTS
   */

  static async generateQualityReport(report, parameters, facilityId) {
    const { startDate, endDate, testTypes, batchIds } = parameters;
    
    try {
      let query = knex('lab_tests')
        .where('facility_id', facilityId);

      if (startDate) query = query.where('sample_date', '>=', startDate);
      if (endDate) query = query.where('sample_date', '<=', endDate);
      if (testTypes?.length) query = query.whereIn('test_type', testTypes);
      if (batchIds?.length) query = query.whereIn('batch_id', batchIds);

      const labTests = await query
        .leftJoin('batches', 'lab_tests.batch_id', 'batches.id')
        .leftJoin('strains', 'batches.strain_id', 'strains.id')
        .select(
          'lab_tests.*',
          'batches.batch_number',
          'strains.name as strain_name'
        )
        .orderBy('lab_tests.sample_date', 'desc');

      // Get batch release data
      const batchReleases = await knex('batch_releases')
        .where('facility_id', facilityId)
        .whereBetween('created_at', [startDate, endDate])
        .leftJoin('batches', 'batch_releases.batch_id', 'batches.id')
        .select(
          'batch_releases.*',
          'batches.batch_number'
        );

      return {
        lab_tests: labTests,
        batch_releases: batchReleases,
        summary: {
          total_tests: labTests.length,
          passed_tests: labTests.filter(t => t.passed === true).length,
          failed_tests: labTests.filter(t => t.passed === false).length,
          pending_tests: labTests.filter(t => t.status === 'pending').length,
          pass_rate: labTests.length > 0 ? 
            ((labTests.filter(t => t.passed === true).length / labTests.length) * 100).toFixed(1) : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate quality report: ${error.message}`);
    }
  }

  /**
   * UTILITY METHODS
   */

  static generateCacheKey(reportId, parameters) {
    const paramString = JSON.stringify(parameters);
    return `report_${reportId}_${Buffer.from(paramString).toString('base64')}`;
  }

  static getStockStatus(item) {
    if (item.available_quantity <= 0) return 'out_of_stock';
    if (item.available_quantity <= item.reorder_point) return 'low_stock';
    if (item.available_quantity >= item.max_stock_level) return 'overstock';
    return 'in_stock';
  }

  static async calculateProductionSummary(data) {
    return {
      total_batches: data.length,
      total_plants: data.reduce((sum, batch) => sum + (batch.actual_plant_count || 0), 0),
      total_harvest_weight: data.reduce((sum, batch) => sum + (parseFloat(batch.total_harvest_weight) || 0), 0),
      average_yield_per_plant: data.length > 0 ? 
        (data.reduce((sum, batch) => sum + parseFloat(batch.yield_per_plant || 0), 0) / data.length).toFixed(2) : 0,
      completed_batches: data.filter(batch => batch.actual_harvest_date).length
    };
  }

  static async calculateInventorySummary(data) {
    return {
      total_items: data.length,
      total_value: data.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0),
      low_stock_items: data.filter(item => item.stock_status === 'low_stock').length,
      out_of_stock_items: data.filter(item => item.stock_status === 'out_of_stock').length,
      expiring_soon: data.filter(item => item.days_until_expiry && item.days_until_expiry <= 30).length
    };
  }

  static async applyCalculations(data, calculations) {
    // Apply custom calculations defined in the report template
    // This would implement formula parsing and execution
    return data;
  }

  static async applyFormatting(data, formatting) {
    // Apply formatting rules (number formats, colors, etc.)
    return data;
  }

  // Additional helper methods would be implemented here...
  static async calculateCostPerGram(facilityId, startDate, endDate) {
    // Implementation for cost per gram calculation
    return 0;
  }

  static async getMetrcSyncStatus(facilityId) {
    // Implementation for METRC sync status
    return { status: 'active', last_sync: new Date() };
  }

  static async getAuditTrailSummary(facilityId, startDate, endDate) {
    // Implementation for audit trail summary
    return { total_events: 0 };
  }

  static async calculateEnvironmentalSummary(data) {
    // Implementation for environmental data summary
    return {};
  }

  static async prepareProductionChartData(data, chartType) {
    // Implementation for production chart data preparation
    return [];
  }

  static async prepareInventoryChartData(data, chartType) {
    // Implementation for inventory chart data preparation
    return [];
  }

  static async prepareFinancialChartData(purchases, sales, chartType) {
    // Implementation for financial chart data preparation
    return [];
  }

  static async prepareEnvironmentalChartData(data, chartType) {
    // Implementation for environmental chart data preparation
    return [];
  }
}

module.exports = ReportEngine;