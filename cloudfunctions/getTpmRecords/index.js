// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const tpmCollection = db.collection('tpm_records')
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取记录总数
    const countResult = await tpmCollection.count()
    const total = countResult.total
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = tpmCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(promise)
    }
    const allRecords = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })
    return {
      success: true,
      data: allRecords.data
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '获取TPM记录失败: ' + e.message,
      error: e
    }
  }
} 