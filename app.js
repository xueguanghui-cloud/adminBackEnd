/** @format */

const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const users = require('./routes/users');
const cors = require('koa2-cors');
const router = require('koa-router')();

const log4js = require('./utils/log4js');
onerror(app);
require('./config/db');

// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
);
app.use(cors());
app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));
app.use(
  views(__dirname + '/views', {
    extension: 'pug'
  })
);

// logger
app.use(async (ctx, next) => {
  log4js.info(
    `params: ${JSON.stringify(ctx.request.query || ctx.request.body)}`
  );
  await next();
});
router.prefix('/api');

router.use(users.routes(), users.allowedMethods());
app.use(router.routes(), router.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(`${err.stack}`);
});

module.exports = app;