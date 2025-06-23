// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const collection = db.collection('breakdown_records')
const MAX_LIMIT = 100 // 每次最多获取100条记录

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取记录总数
    const countResult = await collection.count()
    const total = countResult.total
    
    // 计算需要分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    
    // 承载所有读操作的promise
    const tasks = []
    
    for (let i = 0; i < batchTimes; i++) {
      const promise = collection
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .orderBy('createTime', 'desc')
        .get()
      
      tasks.push(promise)
    }
    
    // 等待所有数据取完
    const results = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg
      }
    }, { data: [], errMsg: '' })
    
    return {
      success: true,
      data: results.data,
      total
    }
  } catch (error) {
    console.error('获取故障记录失败:', error)
    return {
      success: false,
      error,
      message: '获取故障记录失败'
    }
  }
} 