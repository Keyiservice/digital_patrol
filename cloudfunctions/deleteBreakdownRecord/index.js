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
    
    const result = await collection.doc(id).remove()
    
    if (result && result.stats && result.stats.removed > 0) {
      return {
        success: true,
        message: '删除成功'
      }
    } else {
      return {
        success: false,
        message: '删除失败，记录可能不存在'
      }
    }
  } catch (error) {
    console.error('删除故障记录失败:', error)
    return {
      success: false,
      error,
      message: '删除故障记录失败'
    }
  }
} 