// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const collection = db.collection('breakdown_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { id } = event
    
    if (!id) {
      return {
        success: false,
        message: '缺少记录ID'
      }
    }
    
    const result = await collection.doc(id).get()
    
    if (result && result.data) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        message: '记录不存在'
      }
    }
  } catch (error) {
    console.error('获取故障记录详情失败:', error)
    return {
      success: false,
      error,
      message: '获取故障记录详情失败'
    }
  }
} 