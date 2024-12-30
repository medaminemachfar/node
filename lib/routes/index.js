'use strict';

const express = require('express');
const logger = require('../../logger.js');
const validations = require('../validations/index.js');
const Books = require('../api/books');
const { pgconn } = require('../db/config');

const router = express.Router();

// Health check route for the home page
router.get('/', async (req, res) => {
  try {
    // Check if the 'contacts' table exists
    const tableExists = await pgconn.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts')"
    );

    if (!tableExists.rows[0].exists) {
      // Table does not exist, render an empty list
      return res.render('index', { error: null, contacts: null, title: 'Contact List' });
    }

    // Table exists, fetch data from 'contacts'
    const results = await pgconn.query('SELECT * FROM contacts');
    const contacts = results.rows;
    res.render('index', { error: null, contacts, title: 'Contact List' });
  } catch (err) {
    console.error(err);
    res.render('index', {
      error: `Database connection failure! ${err.stack}`,
      contacts: null,
      title: 'Contact List',
    });
  }
});

// Seed test data for 'contacts' table
router.post('/seed', async (req, res) => {
  try {
    await pgconn.query(`
      DROP TABLE IF EXISTS contacts;
      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(30) NOT NULL,
        lastname VARCHAR(30) NOT NULL,
        email VARCHAR(30) NOT NULL
      );
      INSERT INTO contacts (firstname, lastname, email)
      VALUES 
        ('Bilbo', 'Baggins', 'bilbo@theshire.com'),
        ('Frodo', 'Baggins', 'frodo@theshire.com'),
        ('Samwise', 'Gamgee', 'sam@theshire.com'),
        ('Peregrin', 'Took', 'pippin@theshire.com'),
        ('Meriadoc', 'Brandybuck', 'merry@theshire.com');
    `);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('index', {
      error: `Seeding database failure! ${err.stack}`,
      contacts: null,
      title: 'Contact List',
    });
  }
});

// Fetch a specific book by ID
router.get('/Books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Books.find(id);
    if (result.rowCount === 0) {
      return res.status(404).send(`Item ${id} not found`);
    }
    res.send(result.rows[0]);
  } catch (err) {
    logger.error(err);
    res.sendStatus(400);
  }
});

// Fetch all books
router.get('/Books', async (req, res) => {
  try {
    const results = await Books.findAll();
    res.send(results.rows);
  } catch (err) {
    logger.error(err);
    res.sendStatus(400);
  }
});

// Create a new book entry
router.post('/Books', validations.validateCreateUpdateRequest, async (req, res) => {
  const { name, stock } = req.body;

  try {
    const result = await Books.create(name, stock);
    res.status(201).send(result.rows[0]);
  } catch (err) {
    logger.error(err);
    res.status(400).send(err);
  }
});

// Update an existing book
router.put('/Books/:id', validations.validateCreateUpdateRequest, async (req, res) => {
  const { name, stock } = req.body;
  const { id } = req.params;

  try {
    const result = await Books.update({ name, stock, id });
    if (result.rowCount === 0) {
      return res.status(404).send(`Unknown item ${id}`);
    }
    res.sendStatus(204);
  } catch (err) {
    logger.error(err);
    res.status(400).send(err);
  }
});

// Delete a book by ID
router.delete('/Books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Books.remove(id);
    if (result.rowCount === 0) {
      return res.status(404).send(`Unknown item ${id}`);
    }
    res.sendStatus(204);
  } catch (err) {
    logger.error(err);
    res.status(400).send(err);
  }
});

module.exports = router;
