'use strict';

const logger = require('./logger.js');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const db = require('./lib/db');
const Books = require('./lib/routes/books');

// Middleware to parse JSON and URL-encoded payloads
app.use('/', indexRouter);
app.use(bodyParser.json());
app.use((error, request, response, next) => {
  if (request.body === '' || (error instanceof SyntaxError && error.type === 'entity.parse.failed')) {
    response.status(415);
    return response.send('Invalid payload!');
  }
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));

// Serve the "public" folder (for index.html and other static assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the "images" folder (for bookbg.jpg or other images)
app.use('/images', express.static(path.join(__dirname, 'images')));

// API routes
app.use('/api', Books);

// Health check routes
app.use('/ready', (request, response) => {
  return response.sendStatus(200);
});

app.use('/live', (request, response) => {
  return response.sendStatus(200);
});

// Initialize the database
db.init()
  .then(() => {
    logger.info('Database init\'d');
  })
  .catch(error => {
    logger.error(error);
  });

module.exports = app;
