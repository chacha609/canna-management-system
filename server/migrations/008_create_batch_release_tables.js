/**
 * Migration: Create Batch Release Workflow Tables
 * Creates tables for batch release workflows, quality control checkpoints, and approval systems
 */

exports.up = function(knex) {
  return knex.schema
    // Create batch_release_templates table for configurable workflow templates
    .createTable('batch_release_templates', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('product_type', 50).notNullable(); // flower, concentrate, edible, topical, etc.
      table.text('description');
      table.json('checkpoint_sequence').notNullable(); // Array of checkpoint IDs in order
      table.json('approval_chain').notNullable(); // Array of role IDs for approval
      table.boolean('requires_lab_testing').defaultTo(true);
      table.boolean('requires_visual_inspection').defaultTo(true);
      table.boolean('requires_weight_verification').defaultTo(true);
      table.boolean('requires_packaging_inspection').defaultTo(true);
      table.integer('estimated_duration_hours').defaultTo(24);
      table.json('metadata').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    
    // Create release_checkpoints table for quality control checkpoint definitions
    .createTable('release_checkpoints', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('checkpoint_type', 50).notNullable(); // visual_inspection, weight_verification, lab_testing, packaging_inspection, documentation_review
      table.text('description');
      table.json('criteria').notNullable(); // Pass/fail criteria and requirements
      table.json('form_fields').defaultTo('[]'); // Dynamic form configuration
      table.boolean('is_mandatory').defaultTo(true);
      table.boolean('requires_photo').defaultTo(false);
      table.boolean('requires_signature').defaultTo(false);
      table.string('required_role', 50); // Role required to complete this checkpoint
      table.integer('order_sequence').defaultTo(0);
      table.json('metadata').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    
    // Create batch_releases table for individual batch release instances
    .createTable('batch_releases', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('processing_batch_id').unsigned().references('id').inTable('processing_batches').onDelete('CASCADE');
      table.integer('template_id').unsigned().references('id').inTable('batch_release_templates').onDelete('RESTRICT');
      table.string('release_number', 50).notNullable().unique();
      table.string('status', 50).defaultTo('pending'); // pending, in_progress, on_hold, approved, released, rejected
      table.integer('current_checkpoint_id').unsigned().references('id').inTable('release_checkpoints').onDelete('SET NULL');
      table.integer('initiated_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('initiated_at').defaultTo(knex.fn.now());
      table.timestamp('target_completion_date');
      table.timestamp('actual_completion_date');
      table.integer('approved_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('approved_at');
      table.integer('released_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('released_at');
      table.json('release_data').defaultTo('{}'); // Final release information
      table.text('notes');
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
    })
    
    // Create checkpoint_results table for quality control checkpoint results
    .createTable('checkpoint_results', function(table) {
      table.increments('id').primary();
      table.integer('batch_release_id').unsigned().references('id').inTable('batch_releases').onDelete('CASCADE');
      table.integer('checkpoint_id').unsigned().references('id').inTable('release_checkpoints').onDelete('CASCADE');
      table.string('status', 50).defaultTo('pending'); // pending, in_progress, passed, failed, skipped
      table.integer('inspector_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.json('inspection_data').defaultTo('{}'); // Form responses and measurements
      table.json('photos').defaultTo('[]'); // Photo attachments
      table.text('inspector_notes');
      table.text('failure_reason'); // If status is 'failed'
      table.json('corrective_actions').defaultTo('[]'); // Actions taken if failed
      table.boolean('requires_retest').defaultTo(false);
      table.integer('retested_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('retested_at');
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
      
      // Ensure unique checkpoint per batch release
      table.unique(['batch_release_id', 'checkpoint_id']);
    })
    
    // Create release_approvals table for approval chain tracking
    .createTable('release_approvals', function(table) {
      table.increments('id').primary();
      table.integer('batch_release_id').unsigned().references('id').inTable('batch_releases').onDelete('CASCADE');
      table.string('approval_level', 50).notNullable(); // qa_manager, compliance_officer, facility_manager, etc.
      table.integer('required_role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('approver_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('status', 50).defaultTo('pending'); // pending, approved, rejected, delegated
      table.timestamp('requested_at').defaultTo(knex.fn.now());
      table.timestamp('responded_at');
      table.text('approval_notes');
      table.text('rejection_reason');
      table.json('digital_signature').defaultTo('{}'); // Digital signature data
      table.integer('delegated_to_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('delegated_at');
      table.integer('order_sequence').notNullable();
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
    })
    
    // Create release_documents table for associated documents and attachments
    .createTable('release_documents', function(table) {
      table.increments('id').primary();
      table.integer('batch_release_id').unsigned().references('id').inTable('batch_releases').onDelete('CASCADE');
      table.integer('checkpoint_result_id').unsigned().references('id').inTable('checkpoint_results').onDelete('SET NULL');
      table.string('document_type', 50).notNullable(); // coa, inspection_photo, batch_record, compliance_doc, etc.
      table.string('file_name', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('file_type', 50).notNullable(); // pdf, jpg, png, xlsx, etc.
      table.integer('file_size').notNullable(); // in bytes
      table.string('uploaded_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
      table.text('description');
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
    })
    
    // Create release_notifications table for tracking notifications and alerts
    .createTable('release_notifications', function(table) {
      table.increments('id').primary();
      table.integer('batch_release_id').unsigned().references('id').inTable('batch_releases').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('notification_type', 50).notNullable(); // checkpoint_assigned, approval_required, deadline_approaching, etc.
      table.string('title', 200).notNullable();
      table.text('message').notNullable();
      table.string('priority', 20).defaultTo('normal'); // low, normal, high, urgent
      table.boolean('is_read').defaultTo(false);
      table.timestamp('read_at');
      table.boolean('email_sent').defaultTo(false);
      table.timestamp('email_sent_at');
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
    })
    
    // Create release_audit_log table for complete audit trail
    .createTable('release_audit_log', function(table) {
      table.increments('id').primary();
      table.integer('batch_release_id').unsigned().references('id').inTable('batch_releases').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('action', 100).notNullable(); // initiated, checkpoint_completed, approved, rejected, etc.
      table.string('entity_type', 50); // batch_release, checkpoint_result, approval, etc.
      table.integer('entity_id'); // ID of the affected entity
      table.json('old_values').defaultTo('{}');
      table.json('new_values').defaultTo('{}');
      table.text('notes');
      table.string('ip_address', 45);
      table.string('user_agent', 500);
      table.json('metadata').defaultTo('{}');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('release_audit_log')
    .dropTableIfExists('release_notifications')
    .dropTableIfExists('release_documents')
    .dropTableIfExists('release_approvals')
    .dropTableIfExists('checkpoint_results')
    .dropTableIfExists('batch_releases')
    .dropTableIfExists('release_checkpoints')
    .dropTableIfExists('batch_release_templates');
};