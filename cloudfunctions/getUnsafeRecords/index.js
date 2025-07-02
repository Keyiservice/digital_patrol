const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { id, filter, limit } = event;
    const collection = db.collection('unsafe_records');

    if (id) {
      // 如果提供了ID，则获取单个记录
      const record = await collection.doc(id).get();
      return {
        success: true,
        data: record.data,
      };
    } else {
      let query = {};
      
      // 如果提供了筛选条件
      if (filter && Object.keys(filter).length > 0) {
        if (filter.startDate && filter.endDate) {
          query.date = _.gte(filter.startDate).and(_.lte(filter.endDate));
        } else if (filter.startDate) {
          query.date = _.gte(filter.startDate);
        } else if (filter.endDate) {
          query.date = _.lte(filter.endDate);
        }
        
        // 其他可能的筛选条件
        if (filter.reporter) query.reporter = filter.reporter;
        if (filter.location) query.location = filter.location;
      }
      
      // 获取记录总数
      const countResult = await collection.count();
      const total = countResult.total;
      
      // 获取记录，如果指定了limit就使用指定的值，否则使用默认值10
      const recordLimit = limit || 10;
      const records = await collection.where(query).orderBy('date', 'desc').limit(recordLimit).get();
      
      return {
        success: true,
        data: records.data,
        total: total
      };
    }
  } catch (error) {
    console.error('获取不安全记录失败:', error);
    return {
      success: false,
      message: '获取失败',
      error: error,
    };
  }
}; 