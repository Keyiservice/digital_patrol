// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command
const collection = db.collection('breakdown_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { filter } = event;
    let query = collection;

    if (filter && Object.keys(filter).length > 0) {
      const whereClause = {};
      if (filter.department) whereClause.department = filter.department;
      if (filter.startDate && filter.endDate) {
        whereClause.createTime = _.gte(new Date(filter.startDate).getTime()).and(_.lte(new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000 - 1));
      } else if (filter.startDate) {
        whereClause.createTime = _.gte(new Date(filter.startDate).getTime());
      } else if (filter.endDate) {
        whereClause.createTime = _.lte(new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000 - 1);
      }
      query = query.where(whereClause).orderBy('createTime', 'desc');
    } else {
      query = query.orderBy('createTime', 'desc').limit(10);
    }
    
    const res = await query.get();
      
    return {
      success: true,
      data: res.data
    };
  } catch (error) {
    console.error('获取故障记录失败:', error)
    return {
      success: false,
      error,
      message: '获取故障记录失败'
    }
  }
} 