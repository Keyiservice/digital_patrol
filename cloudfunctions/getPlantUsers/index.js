const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { isInterviewer, isInterviewee } = event;
    const collection = db.collection('Plant_user');
    
    let query = {};
    if (isInterviewer) {
      query['是否为访谈人'] = '是';
    }
    if (isInterviewee) {
      query['是否为被访谈人'] = '是';
    }

    console.log('查询条件:', query);
    const users = await collection.where(query).get();
    
    // 统一字段名，方便前端使用
    const formattedUsers = users.data.map(user => ({
      _id: user._id,
      name: user['姓名'] || user.name || user['登录名'] || user.accountName
    }));

    return {
      success: true,
      data: formattedUsers,
    };

  } catch (error) {
    console.error('getPlantUsers-Error:', error);
    return {
      success: false,
      message: '获取用户列表失败',
      error: error.message,
    };
  }
}; 