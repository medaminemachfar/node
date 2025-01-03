'use strict';

const logger = require('../../logger.js');
const serviceBindings = require('kube-service-bindings');
const { Pool } = require('pg');
require('dotenv').config();

let connectionOptions;

try {
  // Attempt to retrieve service bindings if running in a Kubernetes/OpenShift environment
  connectionOptions = serviceBindings.getBinding('POSTGRESQL', 'pg');
  logger.info('Using Kubernetes service bindings for database connection.');
} catch (err) {
  // Fallback to manual configuration if service bindings are not available
  logger.warn('Service bindings not found. Falling back to environment variables.');

  const DB_CONFIG = process.env.DB_CONFIG || 'postgresql://contacts:contacts@localhost:5432/contacts';
  connectionOptions = { connectionString: DB_CONFIG, ssl: false };

  logger.info(`Database connection string: ${DB_CONFIG}`);
}

// Create a new PostgreSQL connection pool
const pool = new Pool(connectionOptions);

// Function to check if the database has been initialized
async function didInitHappen() {
  const query = 'SELECT * FROM products';

  try {
    await pool.query(query);
    logger.info('Database already initialized.');
    return true;
  } catch (err) {
    if (err.code === '42P01') {
      // "Table does not exist" error
      logger.warn('Products table not found. Initialization required.');
    } else {
      logger.error('Database Initialization Check Failed:', err.message);
    }
    return false;
  }
}

// SQL script to initialize the products table and seed data
const initScript = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  stock BIGINT
);

DELETE FROM products;

INSERT INTO products (name, stock) VALUES ('Book1', 10);
INSERT INTO products (name, stock) VALUES ('Book2', 10);
INSERT INTO products (name, stock) VALUES ('Book3', 10);
`;

// Query function that ensures database initialization before executing queries
async function query(text, parameters) {
  try {
    // Check if the database is initialized
    const initHappened = await didInitHappen();
    if (!initHappened) {
      await init();
    }

    // Execute the query
    return pool.query(text, parameters);
  } catch (err) {
    logger.error('Error executing query:', err.message);
    throw err;
  }
}

// Function to initialize the database
async function init() {
  try {
    const initHappened = await didInitHappen();
    if (!initHappened) {
      logger.info('Initializing Database...');
      await pool.query(initScript);
      logger.info('Database initialized successfully.');
    }
  } catch (err) {
    logger.error('Database Initialization Failed:', err.message);
    throw err;
  }
}

// Graceful shutdown: Cleanup connection pool
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing database pool...');
  await pool.end();
  logger.info('Database pool closed.');
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Closing database pool...');
  await pool.end();
  logger.info('Database pool closed.');
});

// Export query and init functions for external use
module.exports = {
  query,
  init,
  pool, // Exporting pool for direct access if needed
};
