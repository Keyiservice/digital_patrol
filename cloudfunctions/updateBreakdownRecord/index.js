// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const collection = db.collection('breakdown_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { id, ...updateData } = event
    
    if (!id) {
      return {
        success: false,
        message: '缺少记录ID'
      }
    }
    
    // 添加更新时间
    updateData.updateTime = new Date().toISOString()
    
    const result = await collection.doc(id).update({
      data: updateData
    })
    
    if (result && result.stats && result.stats.updated > 0) {
      return {
        success: true,
        message: '更新成功'
      }
    } else {
      return {
        success: false,
        message: '更新失败，记录可能不存在'
      }
    }
  } catch (error) {
    console.error('更新故障记录失败:', error)
    return {
      success: false,
      error,
      message: '更新故障记录失败'
    }
  }
} 