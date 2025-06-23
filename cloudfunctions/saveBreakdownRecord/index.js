// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const collection = db.collection('breakdown_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    // 提取记录数据，添加时间戳和openid
    const recordData = {
      ...event,
      _openid: openid,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    // 新增记录
    const result = await collection.add({
      data: recordData
    })
    
    return {
      success: true,
      recordId: result._id,
      message: '记录保存成功'
    }
  } catch (error) {
    console.error('保存故障记录失败:', error)
    return {
      success: false,
      error,
      message: '记录保存失败'
    }
  }
} 