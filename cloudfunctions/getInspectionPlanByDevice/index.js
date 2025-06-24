// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const plansCollection = db.collection('inspection_plans');

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { deviceId } = event;

    if (!deviceId) {
      throw new Error('缺少设备ID');
    }

    const res = await plansCollection.doc(deviceId).get();

    if (res.data) {
      return {
        success: true,
        data: res.data
      };
    } else {
      return {
        success: false,
        message: '未找到该设备的巡检计划'
      };
    }
  } catch (error) {
    console.error('获取巡检计划失败:', error);
    return {
      success: false,
      message: error.message || '获取巡检计划失败'
    };
  }
}; 