'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const createError = require('http-errors');

// Import custom modules
const db = require('./lib/db');
const logger = require('./logger.js');
const Books = require('./lib/routes/books');


const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware setup
app.use(morgan('dev')); // HTTP request logger
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve image assets

// Middleware for handling invalid JSON payloads
app.use((error, req, res, next) => {
  if (req.body === '' || (error instanceof SyntaxError && error.type === 'entity.parse.failed')) {
    res.status(415);
    return res.send('Invalid payload!');
  }
  next();
});

// API routes
app.use('/api', Books);

// Static route


// Health check routes
app.use('/ready', (req, res) => res.sendStatus(200));
app.use('/live', (req, res) => res.sendStatus(200));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  // Provide error message only in development mode
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render error page
  res.status(err.status || 500);
  res.render('error');
});

// Initialize the database and start the server
db.init()
  .then(() => {
    logger.info('Database initialized successfully');
  })
  .catch(error => {
    logger.error('Error initializing database:', error);
    process.exit(1); // Exit process if the database fails to initialize
  });

module.exports = app;
