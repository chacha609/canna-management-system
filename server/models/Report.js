/**
 * Report Model
 * Handles report templates, saved reports, scheduling, and execution
 */

const BaseModel = require('./BaseModel');
const knex = require('../config/database');

class Report extends BaseModel {
  static get tableName() {
    return 'saved_reports';
  }

  /**
   * REPORT TEMPLATE MANAGEMENT
   */

  // Get all report templates
  static async getTemplates(facilityId, filters = {}) {
    try {
      let query = knex('report_templates')
        .where('facility_id', facilityId)
        .where('is_active', true);

      // Apply filters
      if (filters.category) {
        query = query.where('category', filters.category);
      }
      if (filters.report_type) {
        query = query.where('report_type', filters.report_type);
      }
      if (filters.is_system_template !== undefined) {
        query = query.where('is_system_template', filters.is_system_template);
      }
      if (filters.search) {
        query = query.where(function() {
          this.where('name', 'ilike', `%${filters.search}%`)
              .orWhere('description', 'ilike', `%${filters.search}%`);
        });
      }

      const templates = await query
        .leftJoin('users as creators', 'report_templates.created_by_user_id', 'creators.id')
        .select(
          'report_templates.*',
          'creators.first_name as creator_first_name',
          'creators.last_name as creator_last_name'
        )
        .orderBy('report_templates.category')
        .orderBy('report_templates.name');

      return templates;
    } catch (error) {
      throw new Error(`Failed to get report templates: ${error.message}`);
    }
  }

  // Create report template
  static async createTemplate(templateData) {
    try {
      const [template] = await knex('report_templates')
        .insert({
          ...templateData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return template;
    } catch (error) {
      throw new Error(`Failed to create report template: ${error.message}`);
    }
  }

  // Get template by ID
  static async getTemplateById(templateId, facilityId) {
    try {
      const template = await knex('report_templates')
        .where('id', templateId)
        .where('facility_id', facilityId)
        .first();

      if (!template) {
        throw new Error('Report template not found');
      }

      return template;
    } catch (error) {
      throw new Error(`Failed to get report template: ${error.message}`);
    }
  }

  /**
   * SAVED REPORTS MANAGEMENT
   */

  // Get all saved reports
  static async getReports(facilityId, filters = {}) {
    try {
      let query = knex('saved_reports')
        .where('saved_reports.facility_id', facilityId);

      // Apply filters
      if (filters.status) {
        query = query.where('saved_reports.status', filters.status);
      }
      if (filters.template_id) {
        query = query.where('saved_reports.template_id', filters.template_id);
      }
      if (filters.created_by_user_id) {
        query = query.where('saved_reports.created_by_user_id', filters.created_by_user_id);
      }
      if (filters.is_favorite !== undefined) {
        query = query.where('saved_reports.is_favorite', filters.is_favorite);
      }
      if (filters.search) {
        query = query.where(function() {
          this.where('saved_reports.name', 'ilike', `%${filters.search}%`)
              .orWhere('saved_reports.description', 'ilike', `%${filters.search}%`);
        });
      }

      const reports = await query
        .leftJoin('report_templates', 'saved_reports.template_id', 'report_templates.id')
        .leftJoin('users as creators', 'saved_reports.created_by_user_id', 'creators.id')
        .select(
          'saved_reports.*',
          'report_templates.name as template_name',
          'report_templates.category as template_category',
          'report_templates.report_type as template_type',
          'creators.first_name as creator_first_name',
          'creators.last_name as creator_last_name'
        )
        .orderBy('saved_reports.updated_at', 'desc');

      return reports;
    } catch (error) {
      throw new Error(`Failed to get saved reports: ${error.message}`);
    }
  }

  // Create saved report
  static async createReport(reportData) {
    try {
      const [report] = await knex('saved_reports')
        .insert({
          ...reportData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return report;
    } catch (error) {
      throw new Error(`Failed to create saved report: ${error.message}`);
    }
  }

  // Get report by ID with template details
  static async getReportById(reportId, facilityId) {
    try {
      const report = await knex('saved_reports')
        .where('saved_reports.id', reportId)
        .where('saved_reports.facility_id', facilityId)
        .leftJoin('report_templates', 'saved_reports.template_id', 'report_templates.id')
        .leftJoin('users as creators', 'saved_reports.created_by_user_id', 'creators.id')
        .select(
          'saved_reports.*',
          'report_templates.name as template_name',
          'report_templates.category as template_category',
          'report_templates.report_type as template_type',
          'report_templates.data_sources',
          'report_templates.filters as template_filters',
          'report_templates.grouping',
          'report_templates.chart_config as template_chart_config',
          'report_templates.columns',
          'report_templates.calculations',
          'report_templates.formatting',
          'creators.first_name as creator_first_name',
          'creators.last_name as creator_last_name'
        )
        .first();

      if (!report) {
        throw new Error('Saved report not found');
      }

      return report;
    } catch (error) {
      throw new Error(`Failed to get saved report: ${error.message}`);
    }
  }

  // Update saved report
  static async updateReport(reportId, facilityId, updateData) {
    try {
      const [report] = await knex('saved_reports')
        .where('id', reportId)
        .where('facility_id', facilityId)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      if (!report) {
        throw new Error('Saved report not found');
      }

      return report;
    } catch (error) {
      throw new Error(`Failed to update saved report: ${error.message}`);
    }
  }

  /**
   * REPORT EXECUTION MANAGEMENT
   */

  // Create report execution record
  static async createExecution(executionData) {
    try {
      const [execution] = await knex('report_executions')
        .insert({
          ...executionData,
          started_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return execution;
    } catch (error) {
      throw new Error(`Failed to create report execution: ${error.message}`);
    }
  }

  // Update execution status
  static async updateExecution(executionId, updateData) {
    try {
      const [execution] = await knex('report_executions')
        .where('id', executionId)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      return execution;
    } catch (error) {
      throw new Error(`Failed to update report execution: ${error.message}`);
    }
  }

  // Get execution history for a report
  static async getExecutionHistory(reportId, facilityId, limit = 50) {
    try {
      const executions = await knex('report_executions')
        .where('report_id', reportId)
        .where('facility_id', facilityId)
        .leftJoin('users as executors', 'report_executions.executed_by_user_id', 'executors.id')
        .leftJoin('report_schedules', 'report_executions.schedule_id', 'report_schedules.id')
        .select(
          'report_executions.*',
          'executors.first_name as executor_first_name',
          'executors.last_name as executor_last_name',
          'report_schedules.schedule_name'
        )
        .orderBy('report_executions.started_at', 'desc')
        .limit(limit);

      return executions;
    } catch (error) {
      throw new Error(`Failed to get execution history: ${error.message}`);
    }
  }

  /**
   * REPORT SCHEDULING
   */

  // Create report schedule
  static async createSchedule(scheduleData) {
    try {
      const [schedule] = await knex('report_schedules')
        .insert({
          ...scheduleData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return schedule;
    } catch (error) {
      throw new Error(`Failed to create report schedule: ${error.message}`);
    }
  }

  // Get schedules for a report
  static async getSchedules(reportId, facilityId) {
    try {
      const schedules = await knex('report_schedules')
        .where('report_id', reportId)
        .where('facility_id', facilityId)
        .where('is_active', true)
        .leftJoin('users as creators', 'report_schedules.created_by_user_id', 'creators.id')
        .select(
          'report_schedules.*',
          'creators.first_name as creator_first_name',
          'creators.last_name as creator_last_name'
        )
        .orderBy('report_schedules.next_run_at');

      return schedules;
    } catch (error) {
      throw new Error(`Failed to get report schedules: ${error.message}`);
    }
  }

  // Get due schedules
  static async getDueSchedules() {
    try {
      const schedules = await knex('report_schedules')
        .where('is_active', true)
        .where('next_run_at', '<=', new Date())
        .leftJoin('saved_reports', 'report_schedules.report_id', 'saved_reports.id')
        .leftJoin('report_templates', 'saved_reports.template_id', 'report_templates.id')
        .select(
          'report_schedules.*',
          'saved_reports.name as report_name',
          'saved_reports.filter_values',
          'saved_reports.parameters',
          'report_templates.data_sources',
          'report_templates.filters',
          'report_templates.grouping',
          'report_templates.calculations'
        );

      return schedules;
    } catch (error) {
      throw new Error(`Failed to get due schedules: ${error.message}`);
    }
  }

  /**
   * CACHING MANAGEMENT
   */

  // Get cached report data
  static async getCachedData(cacheKey) {
    try {
      const cached = await knex('report_data_cache')
        .where('cache_key', cacheKey)
        .where('expires_at', '>', new Date())
        .first();

      return cached ? cached.data : null;
    } catch (error) {
      throw new Error(`Failed to get cached data: ${error.message}`);
    }
  }

  // Cache report data
  static async cacheData(cacheKey, reportType, parameters, data, expiresInMinutes = 60) {
    try {
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      
      await knex('report_data_cache')
        .insert({
          cache_key: cacheKey,
          report_type: reportType,
          parameters: parameters,
          data: data,
          record_count: Array.isArray(data) ? data.length : 1,
          expires_at: expiresAt,
          created_at: new Date(),
          updated_at: new Date()
        })
        .onConflict('cache_key')
        .merge({
          data: data,
          record_count: Array.isArray(data) ? data.length : 1,
          expires_at: expiresAt,
          updated_at: new Date()
        });

      return true;
    } catch (error) {
      throw new Error(`Failed to cache data: ${error.message}`);
    }
  }

  // Clear expired cache
  static async clearExpiredCache() {
    try {
      const deleted = await knex('report_data_cache')
        .where('expires_at', '<', new Date())
        .del();

      return deleted;
    } catch (error) {
      throw new Error(`Failed to clear expired cache: ${error.message}`);
    }
  }

  /**
   * BOOKMARKS MANAGEMENT
   */

  // Get user bookmarks for a report
  static async getBookmarks(userId, reportId) {
    try {
      const bookmarks = await knex('report_bookmarks')
        .where('user_id', userId)
        .where('report_id', reportId)
        .orderBy('created_at', 'desc');

      return bookmarks;
    } catch (error) {
      throw new Error(`Failed to get bookmarks: ${error.message}`);
    }
  }

  // Create bookmark
  static async createBookmark(bookmarkData) {
    try {
      const [bookmark] = await knex('report_bookmarks')
        .insert({
          ...bookmarkData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return bookmark;
    } catch (error) {
      throw new Error(`Failed to create bookmark: ${error.message}`);
    }
  }

  /**
   * ANALYTICS AND STATISTICS
   */

  // Get report usage statistics
  static async getUsageStats(facilityId, dateRange = 30) {
    try {
      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

      const stats = await knex('report_executions')
        .where('facility_id', facilityId)
        .where('started_at', '>=', startDate)
        .leftJoin('saved_reports', 'report_executions.report_id', 'saved_reports.id')
        .leftJoin('report_templates', 'saved_reports.template_id', 'report_templates.id')
        .select(
          'report_templates.category',
          'report_templates.report_type',
          knex.raw('COUNT(*) as execution_count'),
          knex.raw('AVG(execution_time_ms) as avg_execution_time'),
          knex.raw('SUM(record_count) as total_records')
        )
        .groupBy('report_templates.category', 'report_templates.report_type')
        .orderBy('execution_count', 'desc');

      return stats;
    } catch (error) {
      throw new Error(`Failed to get usage statistics: ${error.message}`);
    }
  }

  // Get popular reports
  static async getPopularReports(facilityId, limit = 10) {
    try {
      const popular = await knex('saved_reports')
        .where('saved_reports.facility_id', facilityId)
        .leftJoin('report_executions', 'saved_reports.id', 'report_executions.report_id')
        .leftJoin('report_templates', 'saved_reports.template_id', 'report_templates.id')
        .select(
          'saved_reports.id',
          'saved_reports.name',
          'report_templates.category',
          knex.raw('COUNT(report_executions.id) as execution_count'),
          knex.raw('MAX(report_executions.started_at) as last_executed')
        )
        .groupBy('saved_reports.id', 'saved_reports.name', 'report_templates.category')
        .orderBy('execution_count', 'desc')
        .limit(limit);

      return popular;
    } catch (error) {
      throw new Error(`Failed to get popular reports: ${error.message}`);
    }
  }
}

module.exports = Report;