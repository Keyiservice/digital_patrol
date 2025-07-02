// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command
const collection = db.collection('breakdown_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { filter, dateRange, pendingOnly } = event;
    let query = collection;
    let whereClause = {};

    // 处理只显示未完成记录
    if (pendingOnly) {
      whereClause.status = _.neq('completed'); // 状态不等于已完成
    }
    // 处理日期范围筛选 - 优先级高于filter
    else if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      whereClause.createTime = _.gte(startDate).and(_.lte(endDate));
    }
    // 处理筛选条件
    else if (filter) {
      // 状态筛选
      if (filter.status) {
        whereClause.status = filter.status;
      }
      // 日期范围筛选
      if (filter.startDate && filter.endDate) {
        whereClause.createTime = _.gte(filter.startDate).and(_.lte(filter.endDate));
      } else if (filter.startDate) {
        whereClause.createTime = _.gte(filter.startDate);
      } else if (filter.endDate) {
        whereClause.createTime = _.lte(filter.endDate);
      }
    }

    let finalQuery = query.where(whereClause).orderBy('createTime', 'desc');
    
    // 如果没有筛选条件且没有日期范围且不是只显示未完成，默认只返回最新的10条
    if ((!filter || Object.keys(filter).length === 0) && !dateRange && !pendingOnly) {
        finalQuery = finalQuery.limit(10);
    }

    const res = await finalQuery.get();
    
    // 获取总数，用于前端判断是否还有更多记录
    const totalRes = await query.count();
      
    return {
      success: true,
      data: res.data,
      total: totalRes.total
    };
  } catch (error) {
    console.error('获取故障记录失败:', error)
    return {
      success: false,
      message: '获取故障记录失败',
      error: error
    }
  }
} 