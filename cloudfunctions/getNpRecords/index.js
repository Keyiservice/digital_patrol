// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const npCollection = db.collection('np_records')
const MAX_LIMIT = 100 // 一次最多获取100条记录

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 如果有指定记录ID，则获取单条记录
    if (event.id) {
      return await npCollection.doc(event.id).get().then(res => {
        return {
          success: true,
          data: res.data
        }
      })
    }
    
    // 获取记录总数
    const countResult = await npCollection.count()
    const total = countResult.total
    
    // 计算需要分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    
    // 承载所有读操作的promise数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = npCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(promise)
    }
    
    // 等待所有
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
      message: '获取记录失败: ' + e.message,
      error: e
    }
  }
} 