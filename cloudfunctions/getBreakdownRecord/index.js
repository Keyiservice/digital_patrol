// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event

  if (!id) {
    return {
      success: false,
      message: '缺少记录ID',
      data: null
    }
  }

  try {
    const recordRes = await db.collection('breakdown_records').doc(id).get()
    
    if (recordRes.data) {
      return {
        success: true,
        message: '查询成功',
        data: recordRes.data
      }
    } else {
      return {
        success: false,
        message: '未找到记录',
        data: null
      }
    }
  } catch (error) {
    console.error('查询记录失败:', error)
    return {
      success: false,
      message: '数据库查询失败',
      error: error
    }
  }
} 