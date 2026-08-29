require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
const serverless = require('serverless-http');
const path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const connectDB = require('./db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./components/auth');
var tasksRouter = require('./routes/tasks');
var boardsRouter = require('./routes/boards');
var listsRouter = require('./routes/lists');
var billingRouter = require('./routes/billing');
var stripeWebhookRouter = require('./routes/stripe-webhook');

const app = express();

const allowedOrigins = [
  'http://localhost:4200',
  'https://peppy-sunburst-59adb5.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS'));
    }
  },
  credentials: true,
}));

app.use(logger('dev'));

// Webhook Stripe : express.raw() (pas besoin de body-parser, déjà inclus dans Express 4.16+)
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB] Erreur de connexion', err);
    res.status(500).json({ message: 'Erreur de connexion à la base de données.' });
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/lists', listsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/categories', categoriesRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});

module.exports = app;
module.exports.handler = serverless(app);