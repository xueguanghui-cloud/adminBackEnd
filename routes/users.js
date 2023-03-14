/**
 * 员工管理模块
 *
 * @format
 */

const router = require('koa-router')();
const User = require('./../models/userSchema');
const Counter = require('./../models/counterSchema');
const util = require('./../utils/util');
const jwt = require('jsonwebtoken');
const md5 = require('md5');

router.prefix('/users');

/**
 * 员工登录
 */
router.post('/login', async (ctx) => {
  const { userName, userPwd } = ctx.request.body;
  try {
    /* 
      返回数据库指定的字段
        - 'userId userName userEmail state deptId	role token roleList'
        - { userId: 0 } => 0:不返回 1:返回
        - select ('userId')
    */
    const res = await User.findOne(
      { userName, userPwd },
      'userId userName userEmail state deptId	role job token roleList'
    );

    // 生成token 密钥 过期时间
    const token = jwt.sign({ data: res._doc }, 'codexgh', { expiresIn: '1h' });

    if (res) {
      ctx.body = util.success({ ...res._doc, token });
    } else {
      ctx.body = util.fail('用户名或密码错误');
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

/**
 * 员工列表
 */
router.get('/list', async (ctx) => {
  const { userId, userName, state, pageNum, pageSize } = ctx.request.query;
  const { page, skipIndex } = util.pager(pageNum, pageSize);
  const params = {};
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state != '0') params.state = state;

  try {
    // 根据条件查询所有的用户列表
    const allUser = User.find(params, { userPwd: 0 });
    const list = await allUser.skip(skipIndex).limit(page.pageSize);
    console.log('=>', list);
    const total = await User.countDocuments(params);
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    });
  } catch (err) {
    ctx.body = util.fail(`查询异常: ${err.stack}`);
  }
});

/**
 * 新增员工
 */
router.post('/create', async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    role,
    job,
    state,
    roleList,
    deptId
  } = ctx.request.body;
  if (!userName && !userEmial && !deptId) {
    return (ctx.body = util.fail('请填写完整信息', util.CODE.PARAM_ERROR));
  }

  const res = await User.findOne(
    { $or: [{ userName }, { userEmail }] },
    '_id, userName, userEmail'
  );
  console.log('=====>', res);
  if (res) {
    return (ctx.body = util.fail(`此用户已经存在：${userName}-${userEmail}`));
  }
  const doc = await Counter.findOneAndUpdate(
    { _id: 'userId' },
    { $inc: { squence_value: 1 } },
    { new: true }
  );
  try {
    const user = new User({
      userId: doc.squence_value,
      userName,
      userPwd: md5('123456'),
      userEmail,
      role,
      state,
      mobile,
      job,
      roleList,
      deptId
    });
    user.save();
    ctx.body = util.success(user, '添加员工成功');
  } catch (err) {
    ctx.body = util.fail('添加员工失败');
  }
});

/**
 * 编辑员工
 */
router.post('/exit', async (ctx) => {
  const { userId, mobile, job, state, roleList, deptId } = ctx.request.body;
  if (!deptId) {
    return (ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR));
  }
  try {
    const res = await User.findOneAndUpdate(
      { userId },
      { mobile, job, state, roleList, deptId }
    );
    ctx.body = util.success(res, '修改员工信息成功');
  } catch (err) {
    ctx.body = util.fail('修改员工信息失败');
  }
});

/**
 * 员工删除
 */
router.post('/delete', async (ctx) => {
  // 待删除员工的ID数组
  const userIds = ctx.request.body;
  // 删除员工 将员工的状态设置为离职
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 });
  console.log(typeof userIds);
  console.log(res);
  if (res.modifiedCount) {
    ctx.body = util.success(res, `共删除${res.modifiedCount}条`);
    return;
  }
  ctx.body = util.fail('删除失败');
});

module.exports = router;
