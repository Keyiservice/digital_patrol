// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { filter, limit } = event;
    let query = db.collection('tpm_records');
    let whereClause = {};

    // 修复排序问题，只对存在 createTime 的记录进行排序
    const orderedQuery = query.where({
      createTime: _.exists(true)
    }).orderBy('createTime', 'desc');

    // 处理筛选条件
    if (filter && Object.keys(filter).length > 0) {
      if (filter.project) whereClause.project = filter.project;
      if (filter.device) whereClause.device = filter.device;
      
      // 按 date 字段进行精确日期或日期范围查询
      if (filter.startDate && filter.endDate) {
        whereClause.date = _.gte(filter.startDate).and(_.lte(filter.endDate));
      } else if (filter.startDate) {
        whereClause.date = filter.startDate;
      }
      
      const filteredQuery = query.where(whereClause);
      const { data } = await filteredQuery.get();
      return { success: true, data: data };

    } else {
      // 默认加载，如果指定了limit就使用指定的值，否则使用默认值10
      const recordLimit = limit || 10;
      const { data } = await orderedQuery.limit(recordLimit).get();
      // 获取总数
      const totalRes = await query.count();
      
      return {
        success: true,
        data: data,
        total: totalRes.total
      };
    }
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: '获取记录失败: ' + e.message,
      error: e
    };
  }
} 