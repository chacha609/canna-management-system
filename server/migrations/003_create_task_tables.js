/**
 * Migration: Create Task Management Tables
 * Creates tables for tasks, templates, assignments, and workflow management
 */

exports.up = function(knex) {
  return knex.schema
    // Create task_templates table
    .createTable('task_templates', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('name', 100).notNullable();
      table.string('category', 50).notNullable(); // cultivation, processing, maintenance, compliance, etc.
      table.text('description');
      table.json('instructions').defaultTo('[]'); // Step-by-step instructions
      table.integer('estimated_duration_minutes');
      table.string('priority', 20).defaultTo('medium'); // low, medium, high, critical
      table.json('required_skills').defaultTo('[]');
      table.json('required_equipment').defaultTo('[]');
      table.json('safety_requirements').defaultTo('[]');
      table.json('dependencies').defaultTo('[]'); // Other template IDs that must be completed first
      table.json('tags').defaultTo('[]');
      table.boolean('is_recurring').defaultTo(false);
      table.json('recurrence_pattern').defaultTo('{}'); // For recurring tasks
      table.boolean('requires_approval').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create tasks table
    .createTable('tasks', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('template_id').unsigned().references('id').inTable('task_templates').onDelete('SET NULL');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.integer('assigned_to_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.integer('assigned_to_role_id').unsigned().references('id').inTable('roles').onDelete('SET NULL');
      table.string('title', 200).notNullable();
      table.text('description');
      table.json('instructions').defaultTo('[]');
      table.string('category', 50).notNullable();
      table.string('priority', 20).defaultTo('medium');
      table.string('status', 50).defaultTo('pending'); // pending, in_progress, completed, cancelled, on_hold
      table.timestamp('due_date');
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.integer('estimated_duration_minutes');
      table.integer('actual_duration_minutes');
      table.json('completion_data').defaultTo('{}'); // Photos, measurements, notes, etc.
      table.json('tags').defaultTo('[]');
      table.text('notes');
      
      // Related entities
      table.integer('plant_id').unsigned().references('id').inTable('plants').onDelete('CASCADE');
      table.integer('batch_id').unsigned().references('id').inTable('batches').onDelete('CASCADE');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      
      // Approval workflow
      table.boolean('requires_approval').defaultTo(false);
      table.integer('approved_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('approved_at');
      table.text('approval_notes');
      
      // Google Calendar integration
      table.string('google_calendar_event_id', 255);
      table.json('calendar_settings').defaultTo('{}');
      
      table.timestamps(true, true);
    })
    
    // Create task_dependencies table
    .createTable('task_dependencies', function(table) {
      table.increments('id').primary();
      table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.integer('depends_on_task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.string('dependency_type', 50).defaultTo('finish_to_start'); // finish_to_start, start_to_start, etc.
      table.timestamps(true, true);
      
      // Ensure no circular dependencies
      table.unique(['task_id', 'depends_on_task_id']);
    })
    
    // Create task_assignments table for team assignments
    .createTable('task_assignments', function(table) {
      table.increments('id').primary();
      table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('assignment_type', 50).defaultTo('assignee'); // assignee, collaborator, reviewer
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.integer('assigned_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create task_comments table
    .createTable('task_comments', function(table) {
      table.increments('id').primary();
      table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.text('comment').notNullable();
      table.json('attachments').defaultTo('[]');
      table.integer('parent_comment_id').unsigned().references('id').inTable('task_comments').onDelete('CASCADE');
      table.boolean('is_internal').defaultTo(false); // Internal notes vs external comments
      table.timestamps(true, true);
    })
    
    // Create task_time_logs table for time tracking
    .createTable('task_time_logs', function(table) {
      table.increments('id').primary();
      table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time');
      table.integer('duration_minutes');
      table.text('description');
      table.boolean('is_billable').defaultTo(false);
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('task_time_logs')
    .dropTableIfExists('task_comments')
    .dropTableIfExists('task_assignments')
    .dropTableIfExists('task_dependencies')
    .dropTableIfExists('tasks')
    .dropTableIfExists('task_templates');
};