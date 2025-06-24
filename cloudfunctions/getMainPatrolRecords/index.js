// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const patrolCollection = db.collection('main_patrol_records');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const res = await patrolCollection
      .where({
        _openid: wxContext.OPENID // 只获取当前用户创建的记录
      })
      .orderBy('createdAt', 'desc') // 按创建时间降序排列
      .get();
    
    return {
      success: true,
      data: res.data
    };
  } catch (error) {
    console.error('获取巡检记录失败:', error);
    return {
      success: false,
      message: '获取失败'
    };
  }
}; 