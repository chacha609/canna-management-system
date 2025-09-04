/**
 * Migration: Create Inventory Management Tables
 * Creates tables for inventory items, suppliers, orders, and tracking
 */

exports.up = function(knex) {
  return knex.schema
    // Create suppliers table
    .createTable('suppliers', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('supplier_type', 50).notNullable(); // seeds, nutrients, equipment, packaging, etc.
      table.string('contact_person', 100);
      table.string('email', 100);
      table.string('phone', 20);
      table.text('address');
      table.string('city', 50);
      table.string('state', 20);
      table.string('zip_code', 10);
      table.string('license_number', 50);
      table.json('certifications').defaultTo('[]');
      table.json('payment_terms').defaultTo('{}');
      table.decimal('credit_limit', 12, 2);
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create inventory_categories table
    .createTable('inventory_categories', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('category_type', 50).notNullable(); // raw_materials, in_process, finished_goods, equipment, consumables
      table.text('description');
      table.integer('parent_category_id').unsigned().references('id').inTable('inventory_categories').onDelete('SET NULL');
      table.json('attributes').defaultTo('{}'); // Category-specific attributes
      table.boolean('requires_testing').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create inventory_items table
    .createTable('inventory_items', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('category_id').unsigned().references('id').inTable('inventory_categories').onDelete('SET NULL');
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL');
      table.string('sku', 50).notNullable().unique();
      table.string('name', 200).notNullable();
      table.text('description');
      table.string('item_type', 50).notNullable(); // raw_material, in_process, finished_product, equipment, consumable
      table.string('unit_of_measure', 20).notNullable(); // grams, ounces, pieces, liters, etc.
      table.decimal('unit_cost', 10, 4);
      table.decimal('current_quantity', 12, 4).defaultTo(0);
      table.decimal('reserved_quantity', 12, 4).defaultTo(0);
      table.decimal('available_quantity', 12, 4).defaultTo(0);
      table.decimal('reorder_point', 12, 4);
      table.decimal('max_stock_level', 12, 4);
      table.string('storage_location', 100);
      table.json('storage_requirements').defaultTo('{}'); // Temperature, humidity, etc.
      table.date('expiration_date');
      table.integer('shelf_life_days');
      table.string('lot_number', 50);
      table.string('batch_number', 50);
      table.json('test_results').defaultTo('{}');
      table.json('certifications').defaultTo('[]');
      table.json('tags').defaultTo('[]');
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create inventory_movements table
    .createTable('inventory_movements', function(table) {
      table.increments('id').primary();
      table.integer('item_id').unsigned().references('id').inTable('inventory_items').onDelete('CASCADE');
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('movement_type', 50).notNullable(); // in, out, transfer, adjustment, waste, loss
      table.decimal('quantity', 12, 4).notNullable();
      table.decimal('unit_cost', 10, 4);
      table.string('from_location', 100);
      table.string('to_location', 100);
      table.string('reference_type', 50); // purchase_order, task, batch, etc.
      table.integer('reference_id'); // ID of the related record
      table.text('reason');
      table.text('notes');
      table.json('metadata').defaultTo('{}');
      table.timestamp('movement_date').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
    
    // Create purchase_orders table
    .createTable('purchase_orders', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('CASCADE');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.integer('approved_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('po_number', 50).notNullable().unique();
      table.string('status', 50).defaultTo('draft'); // draft, pending, approved, ordered, received, cancelled
      table.date('order_date');
      table.date('expected_delivery_date');
      table.date('actual_delivery_date');
      table.decimal('subtotal', 12, 2).defaultTo(0);
      table.decimal('tax_amount', 12, 2).defaultTo(0);
      table.decimal('shipping_cost', 12, 2).defaultTo(0);
      table.decimal('total_amount', 12, 2).defaultTo(0);
      table.json('shipping_address').defaultTo('{}');
      table.text('notes');
      table.json('attachments').defaultTo('[]');
      table.timestamps(true, true);
    })
    
    // Create purchase_order_items table
    .createTable('purchase_order_items', function(table) {
      table.increments('id').primary();
      table.integer('purchase_order_id').unsigned().references('id').inTable('purchase_orders').onDelete('CASCADE');
      table.integer('inventory_item_id').unsigned().references('id').inTable('inventory_items').onDelete('CASCADE');
      table.decimal('quantity_ordered', 12, 4).notNullable();
      table.decimal('quantity_received', 12, 4).defaultTo(0);
      table.decimal('unit_price', 10, 4).notNullable();
      table.decimal('line_total', 12, 2).notNullable();
      table.text('notes');
      table.timestamps(true, true);
    })
    
    // Create clients table for outbound orders
    .createTable('clients', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('client_type', 50).notNullable(); // dispensary, processor, distributor, etc.
      table.string('license_number', 50);
      table.string('contact_person', 100);
      table.string('email', 100);
      table.string('phone', 20);
      table.text('address');
      table.string('city', 50);
      table.string('state', 20);
      table.string('zip_code', 10);
      table.json('payment_terms').defaultTo('{}');
      table.decimal('credit_limit', 12, 2);
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create sales_orders table
    .createTable('sales_orders', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('CASCADE');
      table.integer('created_by_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('order_number', 50).notNullable().unique();
      table.string('status', 50).defaultTo('draft'); // draft, confirmed, fulfilled, shipped, delivered, cancelled
      table.date('order_date');
      table.date('requested_delivery_date');
      table.date('actual_delivery_date');
      table.decimal('subtotal', 12, 2).defaultTo(0);
      table.decimal('tax_amount', 12, 2).defaultTo(0);
      table.decimal('total_amount', 12, 2).defaultTo(0);
      table.json('shipping_address').defaultTo('{}');
      table.string('metrc_manifest_number', 50);
      table.text('notes');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('sales_orders')
    .dropTableIfExists('clients')
    .dropTableIfExists('purchase_order_items')
    .dropTableIfExists('purchase_orders')
    .dropTableIfExists('inventory_movements')
    .dropTableIfExists('inventory_items')
    .dropTableIfExists('inventory_categories')
    .dropTableIfExists('suppliers');
};