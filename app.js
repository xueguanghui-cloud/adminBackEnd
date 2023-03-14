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
const jsonwebtoken = require('jsonwebtoken');
const koajwt = require('koa-jwt');

const log4js = require('./utils/log4js');
const util = require('./utils/util');
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
  await next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 200;
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR);
    } else {
      throw err;
    }
  });
});

// 拦截token,判断token是否有效
app.use(
  koajwt({ secret: 'codexgh' }).unless({
    path: [/^\/api\/users\/login/] // 除了登录结构不校验,其余接口都需要校验
  })
);

router.prefix('/api');

router.use(users.routes(), users.allowedMethods());
app.use(router.routes(), router.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(`${err.stack}`);
});

module.exports = app;
