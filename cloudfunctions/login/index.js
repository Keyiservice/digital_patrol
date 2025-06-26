const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const hashPassword = (password) => {
  const salt = 'a-simple-but-fixed-salt'; 
  const hashedPassword = crypto.createHash('sha256').update(password + salt).digest('hex');
  return hashedPassword;
};

exports.main = async (event, context) => {
  const { username, password } = event;

  if (!username || !password) {
    return {
      success: false,
      message: '用户名和密码不能为空',
    };
  }

  try {
    const userRes = await db.collection('users').where({
      username: username
    }).get();

    if (userRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    const user = userRes.data[0];
    const hashedPassword = hashPassword(password);

    if (user.password === hashedPassword) {
      // Login successful
      return {
        success: true,
        message: '登录成功',
        user: {
          username: user.username,
          plant: user.plant,
          department: user.department,
          role: user.role
        }
      };
    } else {
      // Password incorrect
      return {
        success: false,
        message: '密码错误',
      };
    }
  } catch (e) {
    console.error('登录异常:', e);
    return {
      success: false,
      message: '服务器内部错误',
    };
  }
}; 