/**
 * Migration: Create Core Tables
 * Creates foundational tables for users, roles, facilities, and system configuration
 */

exports.up = function(knex) {
  return knex.schema
    // Create roles table first (referenced by users)
    .createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name', 50).notNullable().unique();
      table.string('display_name', 100).notNullable();
      table.text('description');
      table.json('permissions').defaultTo('[]');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create facilities table
    .createTable('facilities', function(table) {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('license_number', 50).unique();
      table.string('facility_type', 50).notNullable(); // cultivation, processing, retail, etc.
      table.text('address');
      table.string('city', 50);
      table.string('state', 20);
      table.string('zip_code', 10);
      table.string('phone', 20);
      table.string('email', 100);
      table.json('operating_hours').defaultTo('{}');
      table.json('configuration').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create users table
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('username', 50).notNullable().unique();
      table.string('email', 100).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 50).notNullable();
      table.string('last_name', 50).notNullable();
      table.string('phone', 20);
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('SET NULL');
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.json('preferences').defaultTo('{}');
      table.json('notification_settings').defaultTo('{}');
      table.timestamp('last_login');
      table.boolean('is_active').defaultTo(true);
      table.boolean('email_verified').defaultTo(false);
      table.string('email_verification_token', 255);
      table.timestamp('email_verification_expires');
      table.string('password_reset_token', 255);
      table.timestamp('password_reset_expires');
      table.timestamps(true, true);
    })
    
    // Create user_sessions table for refresh tokens
    .createTable('user_sessions', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('refresh_token', 255).notNullable().unique();
      table.string('device_info', 255);
      table.string('ip_address', 45);
      table.timestamp('expires_at').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create rooms table
    .createTable('rooms', function(table) {
      table.increments('id').primary();
      table.integer('facility_id').unsigned().references('id').inTable('facilities').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('room_type', 50).notNullable(); // veg, flower, mother, clone, drying, curing, etc.
      table.string('room_code', 20).unique();
      table.decimal('length', 8, 2);
      table.decimal('width', 8, 2);
      table.decimal('height', 8, 2);
      table.integer('max_capacity');
      table.integer('current_capacity').defaultTo(0);
      table.json('environmental_settings').defaultTo('{}');
      table.json('equipment_list').defaultTo('[]');
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_sessions')
    .dropTableIfExists('users')
    .dropTableIfExists('rooms')
    .dropTableIfExists('facilities')
    .dropTableIfExists('roles');
};