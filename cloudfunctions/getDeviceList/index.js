// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 默认查询 "main_inspection_plans" 集合
    const collectionName = event.collection || 'main_inspection_plans';

    // 查询指定集合中的所有设备
    const result = await db.collection(collectionName).field({
      id: true,
      machine_name: true
    }).get()

    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('getDeviceList云函数出错:', err)
    return {
      success: false,
      message: '获取设备列表失败',
      error: err
    }
  }
} 