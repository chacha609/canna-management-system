require('dotenv').config();

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: '../seeds'
    },
    acquireConnectionTimeout: 60000,
    asyncStackTraces: true
  },

  testing: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME_TEST || 'cannabis_management_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : true
    },
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : true
    },
    pool: {
      min: 5,
      max: 30
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: '../seeds'
    },
    acquireConnectionTimeout: 60000
  }
};