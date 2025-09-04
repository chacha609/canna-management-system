/**
 * Migration: Create Cultivation Tables
 * Creates tables for strains, plants, batches, and cultivation tracking
 */

exports.up = function(knex) {
  return knex.schema
    // Create strains table
    .createTable('strains', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('strain_type', 20).notNullable(); // indica, sativa, hybrid
      table.string('genetics', 255);
      table.text('description');
      table.json('characteristics').defaultTo('{}'); // THC%, CBD%, terpenes, etc.
      table.integer('flowering_time_days');
      table.integer('veg_time_days');
      table.decimal('expected_yield_per_plant', 8, 2);
      table.json('growing_notes').defaultTo('{}');
      table.string('breeder', 100);
      table.string('source', 100);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create batches table
    .createTable('batches', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('strain_id').unsigned().references('id').inTable('strains').onDelete('SET NULL');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      table.string('batch_number', 50).notNullable().unique();
      table.string('batch_name', 100);
      table.string('batch_type', 50).notNullable(); // seed, clone, mother
      table.string('growth_phase', 50).notNullable(); // seedling, clone, veg, flower, harvest, etc.
      table.integer('plant_count').defaultTo(0);
      table.date('start_date').notNullable();
      table.date('expected_harvest_date');
      table.date('actual_harvest_date');
      table.integer('parent_batch_id').unsigned().references('id').inTable('batches').onDelete('SET NULL');
      table.json('cultivation_notes').defaultTo('{}');
      table.json('environmental_data').defaultTo('{}');
      table.json('tags').defaultTo('[]');
      table.string('status', 50).defaultTo('active'); // active, completed, destroyed, transferred
      table.timestamps(true, true);
    })
    
    // Create plants table
    .createTable('plants', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('strain_id').unsigned().references('id').inTable('strains').onDelete('SET NULL');
      table.integer('batch_id').unsigned().references('id').inTable('batches').onDelete('CASCADE');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      table.string('plant_tag', 50).notNullable().unique(); // METRC tag or internal tag
      table.string('metrc_tag', 50).unique();
      table.string('plant_type', 50).notNullable(); // seed, clone, mother
      table.string('growth_phase', 50).notNullable();
      table.integer('mother_plant_id').unsigned().references('id').inTable('plants').onDelete('SET NULL');
      table.date('planted_date').notNullable();
      table.date('harvest_date');
      table.decimal('current_weight', 10, 3);
      table.decimal('harvest_weight', 10, 3);
      table.string('location_code', 50);
      table.json('health_status').defaultTo('{}');
      table.json('cultivation_data').defaultTo('{}');
      table.json('tags').defaultTo('[]');
      table.text('notes');
      table.string('status', 50).defaultTo('active'); // active, harvested, destroyed, transferred
      table.boolean('is_mother_plant').defaultTo(false);
      table.timestamps(true, true);
    })
    
    // Create plant_movements table for tracking location changes
    .createTable('plant_movements', function(table) {
      table.increments('id').primary();
      table.integer('plant_id').unsigned().references('id').inTable('plants').onDelete('CASCADE');
      table.integer('from_room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      table.integer('to_room_id').unsigned().references('id').inTable('rooms').onDelete('SET NULL');
      table.string('from_location', 100);
      table.string('to_location', 100);
      table.integer('moved_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.text('reason');
      table.timestamp('moved_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
    
    // Create plant_health_logs table
    .createTable('plant_health_logs', function(table) {
      table.increments('id').primary();
      table.integer('plant_id').unsigned().references('id').inTable('plants').onDelete('CASCADE');
      table.integer('batch_id').unsigned().references('id').inTable('batches').onDelete('CASCADE');
      table.integer('logged_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('observation_type', 50).notNullable(); // inspection, treatment, issue, recovery
      table.string('health_status', 50); // healthy, sick, recovering, critical
      table.text('observations');
      table.json('symptoms').defaultTo('[]');
      table.json('treatments_applied').defaultTo('[]');
      table.json('photos').defaultTo('[]');
      table.decimal('plant_height', 8, 2);
      table.decimal('plant_width', 8, 2);
      table.timestamp('observed_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('plant_health_logs')
    .dropTableIfExists('plant_movements')
    .dropTableIfExists('plants')
    .dropTableIfExists('batches')
    .dropTableIfExists('strains');
};