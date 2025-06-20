// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const tpmCollection = db.collection('tpm_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    if (!event.id) {
      return { success: false, message: '未指定要删除的记录ID' }
    }
    // 获取记录
    const recordRes = await tpmCollection.doc(event.id).get()
    const record = recordRes.data
    // 删除图片
    if (record.photos && record.photos.length > 0) {
      await cloud.deleteFile({ fileList: record.photos })
    }
    // 删除记录
    const result = await tpmCollection.doc(event.id).remove()
    return { success: true, message: 'TPM记录删除成功', data: result }
  } catch (e) {
    console.error(e)
    return { success: false, message: '删除TPM记录失败: ' + e.message, error: e }
  }
} 