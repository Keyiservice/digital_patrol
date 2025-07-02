// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const npCollection = db.collection('np_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { id, filter, loadAll, page = 1, pageSize = 10 } = event;
    let query = npCollection;
    let total = 0;

    if (id) {
      const res = await query.doc(id).get();
      return { success: true, data: res.data };
    } 
    
    // 获取总记录数
    const countResult = await npCollection.count();
    total = countResult.total;
    
    if (filter && Object.keys(filter).length > 0) {
      const whereClause = {};
      if (filter.project) whereClause.project = filter.project;
      if (filter.treatment) whereClause.treatment = filter.treatment;
      if (filter.startDate && filter.endDate) {
        whereClause.createTime = _.gte(new Date(filter.startDate).getTime()).and(_.lte(new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000 -1));
      } else if (filter.startDate) {
        whereClause.createTime = _.gte(new Date(filter.startDate).getTime());
      } else if (filter.endDate) {
        whereClause.createTime = _.lte(new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000 - 1);
      }
      query = query.where(whereClause).orderBy('createTime', 'desc');
      
      // 获取筛选后的记录总数
      const filteredCountResult = await npCollection.where(whereClause).count();
      total = filteredCountResult.total;
    } else {
      query = query.orderBy('createTime', 'desc');
    }
    
    // 判断是否需要加载所有记录
    if (!loadAll) {
      // 分页处理
      const skip = (page - 1) * pageSize;
      query = query.skip(skip).limit(pageSize);
    }
    
    const res = await query.get();
    return { 
      success: true, 
      data: res.data,
      total,
      currentCount: res.data.length
    };

  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '获取记录失败: ' + e.message,
      error: e
    }
  }
} 