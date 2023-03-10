/**
 * 用户管理模块
 *
 * @format
 */

const router = require('koa-router')();
const User = require('./../models/userSchema');
const util = require('./../utils/util');
const jwt = require('jsonwebtoken');

router.prefix('/users');

router.post('/login', async (ctx) => {
  const { userName, userPwd } = ctx.request.body;
  try {
    const res = await User.findOne({ userName, userPwd });
    const token = jwt.sign(
      {
        data: res._doc
      },
      'codexgh',
      {
        expiresIn: 30
      }
    );
    if (res) {
      ctx.body = util.success({ ...res._doc, token });
    } else {
      ctx.body = util.fail('用户名或密码错误');
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

module.exports = router;
