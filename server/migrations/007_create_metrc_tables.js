/**
 * Migration: Create METRC Integration Tables
 * Creates tables for storing METRC data and sync logs
 */

exports.up = function(knex) {
  return knex.schema
    // METRC Sync Logs Table
    .createTable('metrc_sync_logs', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.string('sync_type', 50).notNullable(); // full_sync, plants, harvests, packages, etc.
      table.text('sync_data'); // JSON data about the sync
      table.enum('status', ['success', 'error', 'in_progress']).defaultTo('in_progress');
      table.text('error_message');
      table.timestamp('synced_at').defaultTo(knex.fn.now());
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');
      table.foreign('user_id').references('users.id').onDelete('CASCADE');

      // Indexes
      table.index(['facility_id', 'sync_type']);
      table.index(['facility_id', 'status']);
      table.index('synced_at');
    })

    // METRC Plants Table
    .createTable('metrc_plants', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC plant ID
      table.string('label', 255); // Plant label/tag
      table.string('state', 50); // Plant state (Vegetative, Flowering, etc.)
      table.string('growth_phase', 50); // Growth phase
      table.string('plant_batch_name', 255);
      table.string('plant_batch_type', 100);
      table.string('location_name', 255);
      table.string('strain_name', 255);
      table.date('planted_date');
      table.date('vegetative_date');
      table.date('flowering_date');
      table.date('harvested_date');
      table.date('destroyed_date');
      table.text('destroyed_note');
      table.timestamp('last_modified'); // METRC last modified timestamp
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'state']);
      table.index(['facility_id', 'growth_phase']);
      table.index(['facility_id', 'strain_name']);
      table.index(['facility_id', 'location_name']);
      table.index('last_modified');
    })

    // METRC Harvests Table
    .createTable('metrc_harvests', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC harvest ID
      table.string('name', 255); // Harvest name
      table.string('harvest_type', 100); // Harvest type
      table.string('drying_location_name', 255);
      table.string('patient_license_number', 100);
      table.date('actual_date'); // Actual harvest date
      table.decimal('gross_weight', 10, 3);
      table.string('gross_unit_of_weight', 50);
      table.decimal('total_waste_weight', 10, 3);
      table.string('total_waste_unit_of_weight', 50);
      table.decimal('total_wet_weight', 10, 3);
      table.string('total_wet_unit_of_weight', 50);
      table.boolean('is_finished').defaultTo(false);
      table.timestamp('last_modified'); // METRC last modified timestamp
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'harvest_type']);
      table.index(['facility_id', 'is_finished']);
      table.index(['facility_id', 'actual_date']);
      table.index('last_modified');
    })

    // METRC Packages Table
    .createTable('metrc_packages', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC package ID
      table.string('label', 255); // Package label/tag
      table.string('package_type', 100); // Package type
      table.string('location_name', 255);
      table.decimal('quantity', 10, 3);
      table.string('unit_of_measure', 50);
      table.date('packaged_date');
      table.timestamp('last_modified'); // METRC last modified timestamp
      table.string('item_name', 255); // Item name from METRC
      table.string('item_product_category_name', 255);
      table.string('item_strain_name', 255);
      table.boolean('is_finished').defaultTo(false);
      table.boolean('is_in_transit').defaultTo(false);
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'package_type']);
      table.index(['facility_id', 'is_finished']);
      table.index(['facility_id', 'is_in_transit']);
      table.index(['facility_id', 'item_name']);
      table.index(['facility_id', 'packaged_date']);
      table.index('last_modified');
    })

    // METRC Items Table
    .createTable('metrc_items', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC item ID
      table.string('name', 255).notNullable(); // Item name
      table.string('product_category_name', 255);
      table.string('product_category_type', 100);
      table.string('quantity_type', 100);
      table.string('default_lab_testing_state', 100);
      table.string('unit_of_measure', 50);
      table.decimal('unit_thc_content', 8, 4);
      table.decimal('unit_thc_content_unit_of_measure_abbreviation', 8, 4);
      table.decimal('unit_cbd_content', 8, 4);
      table.string('unit_cbd_content_unit_of_measure_abbreviation', 50);
      table.string('strain_name', 255);
      table.boolean('is_used').defaultTo(false);
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'name']);
      table.index(['facility_id', 'product_category_name']);
      table.index(['facility_id', 'strain_name']);
      table.index(['facility_id', 'is_used']);
    })

    // METRC Strains Table
    .createTable('metrc_strains', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC strain ID
      table.string('name', 255).notNullable(); // Strain name
      table.string('testing_status', 100);
      table.decimal('thc_level', 8, 4);
      table.decimal('cbd_level', 8, 4);
      table.string('indica_percentage', 10);
      table.string('sativa_percentage', 10);
      table.boolean('is_used').defaultTo(false);
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'name']);
      table.index(['facility_id', 'testing_status']);
      table.index(['facility_id', 'is_used']);
    })

    // METRC Locations Table
    .createTable('metrc_locations', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC location ID
      table.string('name', 255).notNullable(); // Location name
      table.string('location_type_name', 100);
      table.boolean('for_plants').defaultTo(false);
      table.boolean('for_harvests').defaultTo(false);
      table.boolean('for_packages').defaultTo(false);
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'name']);
      table.index(['facility_id', 'location_type_name']);
      table.index(['facility_id', 'for_plants']);
      table.index(['facility_id', 'for_harvests']);
      table.index(['facility_id', 'for_packages']);
    })

    // METRC Transfers Table
    .createTable('metrc_transfers', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().notNullable();
      table.string('metrc_id', 100).notNullable(); // METRC transfer ID
      table.string('manifest_number', 100);
      table.string('shipment_license_type', 100);
      table.string('shipment_transaction_type', 100);
      table.string('shipment_type_name', 100);
      table.date('created_date');
      table.timestamp('created_date_time');
      table.date('last_modified');
      table.string('delivery_count', 10);
      table.string('received_delivery_count', 10);
      table.string('package_count', 10);
      table.string('received_package_count', 10);
      table.enum('direction', ['incoming', 'outgoing']).notNullable();
      table.text('metrc_data'); // Full JSON data from METRC
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('facility_id').references('facilities.id').onDelete('CASCADE');

      // Indexes
      table.unique(['facility_id', 'metrc_id']);
      table.index(['facility_id', 'direction']);
      table.index(['facility_id', 'manifest_number']);
      table.index(['facility_id', 'shipment_type_name']);
      table.index(['facility_id', 'created_date']);
      table.index('last_modified');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('metrc_transfers')
    .dropTableIfExists('metrc_locations')
    .dropTableIfExists('metrc_strains')
    .dropTableIfExists('metrc_items')
    .dropTableIfExists('metrc_packages')
    .dropTableIfExists('metrc_harvests')
    .dropTableIfExists('metrc_plants')
    .dropTableIfExists('metrc_sync_logs');
};