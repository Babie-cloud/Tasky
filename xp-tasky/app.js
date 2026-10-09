require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
const path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const connectDB = require('./db');

const swaggerUi = require('swagger-ui-express');
const { buildSwaggerSpec } = require('./swagger.config');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./components/auth');
var tasksRouter = require('./routes/tasks');
var boardsRouter = require('./routes/boards');
var listsRouter = require('./routes/lists');
var billingRouter = require('./routes/billing');
var stripeWebhookRouter = require('./routes/stripe-webhook');
var categoriesRouter = require('./routes/categories');

const app = express();

function parseOriginList(value) {
  if (!value) return [];
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

const allowedOrigins = new Set([
  'http://localhost:4200',
  'https://peppy-sunburst-59adb5.netlify.app',
  ...parseOriginList(process.env.FRONTEND_URL),
  ...parseOriginList(process.env.ALLOWED_ORIGINS),
]);

if (process.env.URL) allowedOrigins.add(process.env.URL.replace(/\/$/, ''));
if (process.env.DEPLOY_PRIME_URL) {
  allowedOrigins.add(process.env.DEPLOY_PRIME_URL.replace(/\/$/, ''));
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (hostname === 'localhost' || hostname.endsWith('.netlify.app')) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Origine refusée:', origin);
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(logger('dev'));

app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

connectDB().catch(err => console.error('[DB] Erreur critique de connexion', err));

const swaggerSpec = buildSwaggerSpec();

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl: '/stylesheets/swagger-theme.css',
    customSiteTitle: 'Tasky API — Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
    },
  })
);

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