// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const npCollection = db.collection('np_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openId = wxContext.OPENID
    
    // 检查是否是编辑模式
    if (event.id) {
      // 更新记录
      return await npCollection.doc(event.id).update({
        data: {
          project: event.project,
          date: event.date,
          time: event.time,
          reason: event.reason,
          treatment: event.treatment,
          barcodePhotoUrl: event.barcodePhotoUrl,
          defectLocationPhotoUrl: event.defectLocationPhotoUrl,
          updatedTime: Date.now(),
          updatedBy: openId
        }
      }).then(res => {
        return {
          success: true,
          message: '记录更新成功',
          data: {
            id: event.id
          }
        }
      })
    } else {
      // 创建新记录
      return await npCollection.add({
        data: {
          project: event.project,
          date: event.date,
          time: event.time,
          reason: event.reason,
          treatment: event.treatment,
          barcodePhotoUrl: event.barcodePhotoUrl,
          defectLocationPhotoUrl: event.defectLocationPhotoUrl,
          status: 'Open', // 默认状态为Open
          createTime: event.createTime || Date.now(),
          createdBy: openId,
          updatedTime: Date.now(),
          updatedBy: openId
        }
      }).then(res => {
        return {
          success: true,
          message: '记录添加成功',
          data: {
            id: res._id
          }
        }
      })
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '操作失败: ' + e.message,
      error: e
    }
  }
} 