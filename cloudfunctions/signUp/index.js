const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// Function to create a salted hash of the password
const hashPassword = (password) => {
  // Simple salt for demonstration. In a real-world app, use a unique salt per user.
  const salt = 'a-simple-but-fixed-salt'; 
  const hashedPassword = crypto.createHash('sha256').update(password + salt).digest('hex');
  return hashedPassword;
};

exports.main = async (event, context) => {
  const { username, password, plant, department } = event;

  // 1. Basic validation
  if (!username || !password || !plant || !department) {
    return {
      success: false,
      message: '所有字段均为必填项',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: '密码长度不能少于6位',
    };
  }
  
  try {
    // 2. Check if username already exists
    const userRes = await db.collection('users').where({
      username: username
    }).count();

    if (userRes.total > 0) {
      return {
        success: false,
        message: '该用户名已被注册',
      };
    }

    // 3. Hash the password
    const hashedPassword = hashPassword(password);

    // 4. Add the new user to the database
    await db.collection('users').add({
      data: {
        username: username,
        password: hashedPassword,
        plant: plant,
        department: department,
        createTime: db.serverDate(),
        role: 'user' // Default role
      }
    });

    return {
      success: true,
      message: '注册成功'
    };

  } catch (e) {
    console.error('注册异常:', e);
    return {
      success: false,
      message: '服务器内部错误'
    };
  }
}; 