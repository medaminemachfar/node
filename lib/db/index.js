'use strict';

const logger = require('../../logger.js');

const serviceBindings = require('kube-service-bindings');
const { Pool } = require('pg');

let connectionOptions;

try {
  // Attempt to retrieve service bindings if running in a Kubernetes/OpenShift environment
  connectionOptions = serviceBindings.getBinding('POSTGRESQL', 'pg');
} catch (err) {
  // Fallback to manual configuration if service bindings are not available
  const serviceHost = process.env.DB_HOST || process.env.MY_DATABASE_SERVICE_HOST || process.env.POSTGRESQL_SERVICE_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USERNAME || process.env.POSTGRESQL_USER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.POSTGRESQL_PASSWORD || '12345';
  const databaseName = process.env.DB_NAME || process.env.POSTGRESQL_DATABASE || 'books-db';

  // Construct the connection string
  const connectionString = `postgresql://${user}:${password}@${serviceHost}:${port}/${databaseName}`;
  connectionOptions = { connectionString };
}

// Create a new PostgreSQL connection pool
const pool = new Pool(connectionOptions);

// Function to check if the database has been initialized
async function didInitHappen() {
  const query = 'SELECT * FROM products';

  try {
    await pool.query(query);
    logger.info('Database Already Created');
    return true;
  } catch (err) {
    logger.error('Database Initialization Check Failed:', err.message);
    return false;
  }
}

// SQL script to initialize the products table and seed data
const initScript = `CREATE TABLE IF NOT EXISTS products (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(40) NOT NULL,
  stock     BIGINT
);

DELETE FROM products;

INSERT INTO products (name, stock) VALUES ('Book1', 10);
INSERT INTO products (name, stock) VALUES ('Book2', 10);
INSERT INTO products (name, stock) VALUES ('Book3', 10);`;

// Query function that ensures database initialization before executing queries
async function query(text, parameters) {
  // Check if the database is initialized
  const initHappened = await didInitHappen();
  if (!initHappened) {
    await init();
  }

  // Execute the query
  return pool.query(text, parameters);
}

// Function to initialize the database
async function init() {
  const initHappened = await didInitHappen();
  if (!initHappened) {
    logger.info('Initializing Database...');
    return pool.query(initScript);
  }
}

// Export query and init functions for external use
module.exports = {
  query,
  init
};
