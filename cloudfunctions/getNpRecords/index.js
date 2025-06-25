// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const npCollection = db.collection('np_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { id, filter } = event;
    let query = npCollection;

    if (id) {
      const res = await query.doc(id).get();
      return { success: true, data: res.data };
    } 
    
    if (filter && Object.keys(filter).length > 0) {
      const whereClause = {};
      if (filter.project) whereClause.project = filter.project;
      if (filter.reason) whereClause.reason = filter.reason;
      if (filter.startDate && filter.endDate) {
        whereClause.createTime = _.gte(new Date(filter.startDate).getTime()).and(_.lte(new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000 -1));
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
    return { success: true, data: res.data };

  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '获取记录失败: ' + e.message,
      error: e
    }
  }
} 