/**
 * Migration: Create Reporting Tables
 * Creates tables for reports, report templates, scheduled reports, and report executions
 */

exports.up = function(knex) {
  return knex.schema
    // Create report_templates table
    .createTable('report_templates', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('name', 200).notNullable();
      table.string('category', 50).notNullable(); // production, inventory, financial, compliance, environmental, quality, custom
      table.string('report_type', 50).notNullable(); // summary, detailed, trend, comparison, dashboard
      table.text('description');
      table.json('data_sources').defaultTo('[]'); // Array of table names and joins
      table.json('filters').defaultTo('{}'); // Default filter configuration
      table.json('grouping').defaultTo('{}'); // Grouping and aggregation rules
      table.json('chart_config').defaultTo('{}'); // Chart type and configuration
      table.json('columns').defaultTo('[]'); // Column definitions for tabular reports
      table.json('calculations').defaultTo('[]'); // Custom calculations and formulas
      table.json('formatting').defaultTo('{}'); // Number formatting, colors, etc.
      table.boolean('is_system_template').defaultTo(false); // System vs user-created
      table.boolean('is_public').defaultTo(false); // Available to all users in facility
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create saved_reports table
    .createTable('saved_reports', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('template_id').unsigned().references('id').inTable('report_templates').onDelete('CASCADE');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('name', 200).notNullable();
      table.text('description');
      table.json('filter_values').defaultTo('{}'); // Applied filter values
      table.json('parameters').defaultTo('{}'); // Report parameters (date ranges, etc.)
      table.json('chart_config').defaultTo('{}'); // Customized chart configuration
      table.string('status', 50).defaultTo('draft'); // draft, published, archived
      table.boolean('is_favorite').defaultTo(false);
      table.json('sharing_settings').defaultTo('{}'); // Who can view/edit
      table.json('tags').defaultTo('[]');
      table.timestamps(true, true);
    })
    
    // Create report_schedules table
    .createTable('report_schedules', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('report_id').unsigned().references('id').inTable('saved_reports').onDelete('CASCADE');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('schedule_name', 200).notNullable();
      table.string('frequency', 50).notNullable(); // daily, weekly, monthly, quarterly, yearly, custom
      table.json('schedule_config').defaultTo('{}'); // Cron expression, specific days, etc.
      table.json('recipients').defaultTo('[]'); // Email addresses and user IDs
      table.json('export_formats').defaultTo('["pdf"]'); // pdf, excel, csv
      table.string('delivery_method', 50).defaultTo('email'); // email, dashboard, both
      table.timestamp('next_run_at');
      table.timestamp('last_run_at');
      table.integer('run_count').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create report_executions table
    .createTable('report_executions', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('report_id').unsigned().references('id').inTable('saved_reports').onDelete('CASCADE');
      table.integer('schedule_id').unsigned().references('id').inTable('report_schedules').onDelete('SET NULL');
      table.integer('executed_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('execution_type', 50).notNullable(); // manual, scheduled, api
      table.json('parameters').defaultTo('{}'); // Parameters used for this execution
      table.string('status', 50).defaultTo('pending'); // pending, running, completed, failed, cancelled
      table.timestamp('started_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.integer('execution_time_ms');
      table.integer('record_count');
      table.json('result_summary').defaultTo('{}'); // Key metrics from the report
      table.json('export_files').defaultTo('[]'); // Generated file paths
      table.text('error_message');
      table.json('performance_metrics').defaultTo('{}'); // Query times, memory usage, etc.
      table.timestamps(true, true);
    })
    
    // Create report_data_cache table for performance
    .createTable('report_data_cache', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('cache_key', 255).notNullable().unique();
      table.string('report_type', 50).notNullable();
      table.json('parameters').defaultTo('{}');
      table.json('data').notNullable(); // Cached report data
      table.integer('record_count');
      table.timestamp('expires_at').notNullable();
      table.timestamps(true, true);
      
      // Index for efficient cache lookups
      table.index(['cache_key', 'expires_at']);
    })
    
    // Create report_bookmarks table
    .createTable('report_bookmarks', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('report_id').unsigned().references('id').inTable('saved_reports').onDelete('CASCADE');
      table.string('bookmark_name', 200);
      table.json('filter_values').defaultTo('{}'); // Bookmarked filter state
      table.json('view_settings').defaultTo('{}'); // Chart type, sorting, etc.
      table.timestamps(true, true);
      
      // Ensure unique bookmark per user per report
      table.unique(['user_id', 'report_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('report_bookmarks')
    .dropTableIfExists('report_data_cache')
    .dropTableIfExists('report_executions')
    .dropTableIfExists('report_schedules')
    .dropTableIfExists('saved_reports')
    .dropTableIfExists('report_templates');
};