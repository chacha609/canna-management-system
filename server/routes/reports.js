/**
 * Reports API Routes
 * Comprehensive reporting system with templates, saved reports, and execution
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, requirePermission } = require('../middleware/auth');
const { Report } = require('../models');
const ReportEngine = require('../services/reportEngine');

const router = express.Router();

/**
 * REPORT TEMPLATES ROUTES
 */

// Get all report templates
router.get('/templates', auth, asyncHandler(async (req, res) => {
  const { category, report_type, is_system_template, search } = req.query;
  
  const templates = await Report.getTemplates(req.user.facility_id, {
    category,
    report_type,
    is_system_template: is_system_template === 'true',
    search
  });

  res.json({
    success: true,
    data: templates,
    message: `Found ${templates.length} report templates`
  });
}));

// Get template by ID
router.get('/templates/:id', auth, asyncHandler(async (req, res) => {
  const template = await Report.getTemplateById(req.params.id, req.user.facility_id);
  
  res.json({
    success: true,
    data: template,
    message: 'Template retrieved successfully'
  });
}));

// Create new template (admin only)
router.post('/templates', auth, requirePermission('reports:create'), asyncHandler(async (req, res) => {
  const templateData = {
    ...req.body,
    facility_id: req.user.facility_id,
    created_by_user_id: req.user.id
  };

  const template = await Report.createTemplate(templateData);

  res.status(201).json({
    success: true,
    data: template,
    message: 'Report template created successfully'
  });
}));

/**
 * SAVED REPORTS ROUTES
 */

// Get all saved reports
router.get('/', auth, asyncHandler(async (req, res) => {
  const { status, template_id, created_by_user_id, is_favorite, search, page = 1, limit = 50 } = req.query;
  
  const reports = await Report.getReports(req.user.facility_id, {
    status,
    template_id,
    created_by_user_id,
    is_favorite: is_favorite === 'true',
    search
  });

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedReports = reports.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedReports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: reports.length,
      pages: Math.ceil(reports.length / limit)
    },
    message: `Found ${reports.length} saved reports`
  });
}));

// Get report by ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const report = await Report.getReportById(req.params.id, req.user.facility_id);
  
  res.json({
    success: true,
    data: report,
    message: 'Report retrieved successfully'
  });
}));

// Create new saved report
router.post('/', auth, requirePermission('reports:create'), asyncHandler(async (req, res) => {
  const reportData = {
    ...req.body,
    facility_id: req.user.facility_id,
    created_by_user_id: req.user.id
  };

  const report = await Report.createReport(reportData);

  res.status(201).json({
    success: true,
    data: report,
    message: 'Report saved successfully'
  });
}));

// Update saved report
router.put('/:id', auth, requirePermission('reports:edit'), asyncHandler(async (req, res) => {
  const report = await Report.updateReport(req.params.id, req.user.facility_id, req.body);

  res.json({
    success: true,
    data: report,
    message: 'Report updated successfully'
  });
}));

// Delete saved report
router.delete('/:id', auth, requirePermission('reports:delete'), asyncHandler(async (req, res) => {
  await Report.updateReport(req.params.id, req.user.facility_id, { status: 'archived' });

  res.json({
    success: true,
    message: 'Report archived successfully'
  });
}));

/**
 * REPORT EXECUTION ROUTES
 */

// Execute/Generate report
router.post('/:id/execute', auth, asyncHandler(async (req, res) => {
  const { parameters = {} } = req.body;
  
  // Create execution record
  const execution = await Report.createExecution({
    facility_id: req.user.facility_id,
    report_id: req.params.id,
    executed_by_user_id: req.user.id,
    execution_type: 'manual',
    parameters,
    status: 'running'
  });

  try {
    // Generate report data
    const startTime = Date.now();
    const reportData = await ReportEngine.generateReport(req.params.id, req.user.facility_id, parameters);
    const executionTime = Date.now() - startTime;

    // Update execution record
    await Report.updateExecution(execution.id, {
      status: 'completed',
      completed_at: new Date(),
      execution_time_ms: executionTime,
      record_count: Array.isArray(reportData.data) ? reportData.data.length : 1,
      result_summary: reportData.summary || {}
    });

    res.json({
      success: true,
      data: reportData,
      execution: {
        id: execution.id,
        execution_time_ms: executionTime,
        record_count: Array.isArray(reportData.data) ? reportData.data.length : 1
      },
      message: 'Report generated successfully'
    });

  } catch (error) {
    // Update execution record with error
    await Report.updateExecution(execution.id, {
      status: 'failed',
      completed_at: new Date(),
      error_message: error.message
    });

    throw error;
  }
}));

// Get execution history
router.get('/:id/executions', auth, asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  
  const executions = await Report.getExecutionHistory(req.params.id, req.user.facility_id, parseInt(limit));

  res.json({
    success: true,
    data: executions,
    message: `Found ${executions.length} execution records`
  });
}));

/**
 * REPORT SCHEDULING ROUTES
 */

// Get schedules for a report
router.get('/:id/schedules', auth, asyncHandler(async (req, res) => {
  const schedules = await Report.getSchedules(req.params.id, req.user.facility_id);

  res.json({
    success: true,
    data: schedules,
    message: `Found ${schedules.length} schedules`
  });
}));

// Create report schedule
router.post('/:id/schedules', auth, requirePermission('reports:schedule'), asyncHandler(async (req, res) => {
  const scheduleData = {
    ...req.body,
    facility_id: req.user.facility_id,
    report_id: req.params.id,
    created_by_user_id: req.user.id
  };

  const schedule = await Report.createSchedule(scheduleData);

  res.status(201).json({
    success: true,
    data: schedule,
    message: 'Report schedule created successfully'
  });
}));

/**
 * BOOKMARKS ROUTES
 */

// Get user bookmarks for a report
router.get('/:id/bookmarks', auth, asyncHandler(async (req, res) => {
  const bookmarks = await Report.getBookmarks(req.user.id, req.params.id);

  res.json({
    success: true,
    data: bookmarks,
    message: `Found ${bookmarks.length} bookmarks`
  });
}));

// Create bookmark
router.post('/:id/bookmarks', auth, asyncHandler(async (req, res) => {
  const bookmarkData = {
    ...req.body,
    user_id: req.user.id,
    report_id: req.params.id
  };

  const bookmark = await Report.createBookmark(bookmarkData);

  res.status(201).json({
    success: true,
    data: bookmark,
    message: 'Bookmark created successfully'
  });
}));

/**
 * ANALYTICS ROUTES
 */

// Get report usage statistics
router.get('/analytics/usage', auth, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const stats = await Report.getUsageStats(req.user.facility_id, parseInt(days));

  res.json({
    success: true,
    data: stats,
    message: 'Usage statistics retrieved successfully'
  });
}));

// Get popular reports
router.get('/analytics/popular', auth, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const popular = await Report.getPopularReports(req.user.facility_id, parseInt(limit));

  res.json({
    success: true,
    data: popular,
    message: 'Popular reports retrieved successfully'
  });
}));

/**
 * EXPORT ROUTES
 */

// Export report data (CSV, Excel, PDF)
router.post('/:id/export', auth, asyncHandler(async (req, res) => {
  const { format = 'csv', parameters = {} } = req.body;
  
  // Generate report data first
  const reportData = await ReportEngine.generateReport(req.params.id, req.user.facility_id, parameters);
  
  // TODO: Implement actual export functionality
  // For now, return the data with export format info
  res.json({
    success: true,
    data: reportData,
    export: {
      format,
      filename: `report_${req.params.id}_${Date.now()}.${format}`,
      generated_at: new Date()
    },
    message: `Report exported as ${format.toUpperCase()}`
  });
}));

/**
 * CACHE MANAGEMENT ROUTES
 */

// Clear report cache
router.delete('/cache', auth, requirePermission('reports:admin'), asyncHandler(async (req, res) => {
  const cleared = await Report.clearExpiredCache();

  res.json({
    success: true,
    data: { cleared_entries: cleared },
    message: `Cleared ${cleared} expired cache entries`
  });
}));

module.exports = router;