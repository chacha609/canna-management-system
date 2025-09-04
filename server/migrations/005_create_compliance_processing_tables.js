/**
 * Migration: Create Compliance and Processing Tables
 * Creates tables for compliance tracking, processing workflows, and system integrations
 */

exports.up = function(knex) {
  return knex.schema
    // Create processing_batches table for post-harvest processing
    .createTable('processing_batches', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('source_batch_id').unsigned().references('id').inTable('batches').onDelete('CASCADE');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      table.string('processing_batch_number', 50).notNullable().unique();
      table.string('processing_type', 50).notNullable(); // drying, curing, trimming, extraction, etc.
      table.string('status', 50).defaultTo('in_progress'); // in_progress, completed, on_hold, failed
      table.decimal('input_weight', 10, 3).notNullable();
      table.decimal('current_weight', 10, 3);
      table.decimal('output_weight', 10, 3);
      table.decimal('waste_weight', 10, 3).defaultTo(0);
      table.decimal('moisture_content_start', 5, 2);
      table.decimal('moisture_content_current', 5, 2);
      table.decimal('moisture_content_target', 5, 2);
      table.date('start_date').notNullable();
      table.date('expected_completion_date');
      table.date('actual_completion_date');
      table.json('processing_parameters').defaultTo('{}'); // Temperature, humidity, etc.
      table.json('quality_metrics').defaultTo('{}');
      table.json('tags').defaultTo('[]');
      table.text('notes');
      table.timestamps(true, true);
    })
    
    // Create waste_logs table for waste tracking
    .createTable('waste_logs', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('logged_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('waste_type', 50).notNullable(); // plant_waste, trim, stems, roots, soil, etc.
      table.string('source_type', 50).notNullable(); // plant, batch, processing_batch, inventory_item
      table.integer('source_id').notNullable(); // ID of the source record
      table.decimal('weight', 10, 3).notNullable();
      table.string('disposal_method', 50).notNullable(); // compost, incinerate, landfill, etc.
      table.string('reason', 100).notNullable(); // harvest_waste, defective, expired, etc.
      table.date('disposal_date');
      table.string('disposal_location', 100);
      table.integer('witnessed_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.json('photos').defaultTo('[]');
      table.string('metrc_waste_id', 50);
      table.text('notes');
      table.timestamps(true, true);
    })
    
    // Create compliance_events table
    .createTable('compliance_events', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('event_type', 50).notNullable(); // plant_tag, movement, harvest, package, transfer, etc.
      table.string('entity_type', 50).notNullable(); // plant, batch, inventory_item, etc.
      table.integer('entity_id').notNullable();
      table.string('metrc_id', 50);
      table.json('event_data').defaultTo('{}');
      table.string('status', 50).defaultTo('pending'); // pending, submitted, accepted, rejected
      table.timestamp('event_timestamp').defaultTo(knex.fn.now());
      table.timestamp('submitted_to_metrc');
      table.json('metrc_response').defaultTo('{}');
      table.text('notes');
      table.timestamps(true, true);
    })
    
    // Create lab_tests table
    .createTable('lab_tests', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('batch_id').unsigned().references('id').inTable('batches').onDelete('CASCADE');
      table.integer('processing_batch_id').unsigned().references('id').inTable('processing_batches').onDelete('SET NULL');
      table.integer('inventory_item_id').unsigned().references('id').inTable('inventory_items').onDelete('SET NULL');
      table.string('test_type', 50).notNullable(); // potency, pesticides, heavy_metals, microbials, etc.
      table.string('lab_name', 100).notNullable();
      table.string('lab_license', 50);
      table.string('sample_id', 50).notNullable();
      table.decimal('sample_weight', 8, 3);
      table.date('sample_date').notNullable();
      table.date('test_date');
      table.date('result_date');
      table.string('status', 50).defaultTo('pending'); // pending, in_progress, completed, failed
      table.json('test_results').defaultTo('{}');
      table.boolean('passed').defaultTo(null);
      table.json('attachments').defaultTo('[]'); // COA files, etc.
      table.text('notes');
      table.timestamps(true, true);
    })
    
    // Create environmental_data table
    .createTable('environmental_data', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('CASCADE');
      table.string('sensor_type', 50).notNullable(); // temperature, humidity, co2, ph, ec, etc.
      table.string('sensor_id', 50);
      table.string('integration_source', 50); // growlink, altequa, dositron, manual
      table.decimal('value', 10, 4).notNullable();
      table.string('unit', 20).notNullable();
      table.timestamp('recorded_at').notNullable();
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
      
      // Index for efficient time-series queries
      table.index(['room_id', 'sensor_type', 'recorded_at']);
    })
    
    // Create alerts table
    .createTable('alerts', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      table.string('alert_type', 50).notNullable(); // environmental, equipment, compliance, task, etc.
      table.string('severity', 20).notNullable(); // info, warning, critical, emergency
      table.string('title', 200).notNullable();
      table.text('message').notNullable();
      table.string('source', 50); // growlink, altequa, dositron, system, user
      table.json('alert_data').defaultTo('{}');
      table.string('status', 50).defaultTo('active'); // active, acknowledged, resolved, dismissed
      table.integer('acknowledged_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('acknowledged_at');
      table.integer('resolved_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('resolved_at');
      table.text('resolution_notes');
      table.timestamp('triggered_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
    
    // Create integrations table
    .createTable('integrations', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('integration_type', 50).notNullable(); // metrc, growlink, altequa, dositron, google
      table.string('name', 100).notNullable();
      table.json('configuration').defaultTo('{}');
      table.json('credentials').defaultTo('{}'); // Encrypted
      table.string('status', 50).defaultTo('inactive'); // active, inactive, error, maintenance
      table.timestamp('last_sync');
      table.json('sync_status').defaultTo('{}');
      table.json('error_log').defaultTo('[]');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create system_tags table for the comprehensive tagging system
    .createTable('system_tags', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('category', 50).notNullable(); // growth_stage, processing_stage, location, quality, treatment, compliance
      table.string('color', 7).defaultTo('#6B7280'); // Hex color code
      table.text('description');
      table.integer('parent_tag_id').unsigned().references('id').inTable('system_tags').onDelete('SET NULL');
      table.json('automation_rules').defaultTo('{}');
      table.boolean('is_system_tag').defaultTo(false); // System vs user-defined
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create entity_tags table for tagging any entity
    .createTable('entity_tags', function(table) {
      table.increments('id').primary();
      table.integer('tag_id').unsigned().references('id').inTable('system_tags').onDelete('CASCADE');
      table.string('entity_type', 50).notNullable(); // plant, batch, task, inventory_item, etc.
      table.integer('entity_id').notNullable();
      table.integer('tagged_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('tagged_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
      
      // Ensure unique tag per entity
      table.unique(['tag_id', 'entity_type', 'entity_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('entity_tags')
    .dropTableIfExists('system_tags')
    .dropTableIfExists('integrations')
    .dropTableIfExists('alerts')
    .dropTableIfExists('environmental_data')
    .dropTableIfExists('lab_tests')
    .dropTableIfExists('compliance_events')
    .dropTableIfExists('waste_logs')
    .dropTableIfExists('processing_batches');
};