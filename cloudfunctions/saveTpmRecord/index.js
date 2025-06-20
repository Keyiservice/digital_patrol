// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const tpmCollection = db.collection('tpm_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 新增TPM记录
    return await tpmCollection.add({
      data: {
        project: event.project,
        device: event.device,
        date: event.date,
        time: event.time,
        maintainer: event.maintainer,
        photos: event.photos,
        createTime: event.createTime || new Date().toISOString(),
        _openid: cloud.getWXContext().OPENID
      }
    }).then(res => {
      return {
        success: true,
        message: 'TPM记录添加成功',
        data: { id: res._id }
      }
    })
  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '操作失败: ' + e.message,
      error: e
    }
  }
}
