// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const npCollection = db.collection('np_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    if (!event.id) {
      return {
        success: false,
        message: '未指定要删除的记录ID'
      }
    }
    
    // 获取记录信息，包括图片URL
    const recordRes = await npCollection.doc(event.id).get()
    const record = recordRes.data
    
    // 删除关联的图片文件
    const photoUrls = []
    if (record.barcodePhotoUrl) {
      photoUrls.push(record.barcodePhotoUrl)
    }
    if (record.defectLocationPhotoUrl) {
      photoUrls.push(record.defectLocationPhotoUrl)
    }
    
    // 如果有图片需要删除
    if (photoUrls.length > 0) {
      await cloud.deleteFile({
        fileList: photoUrls
      })
    }
    
    // 删除记录数据
    const result = await npCollection.doc(event.id).remove()
    
    return {
      success: true,
      message: '记录删除成功',
      data: result
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '删除记录失败: ' + e.message,
      error: e
    }
  }
} 