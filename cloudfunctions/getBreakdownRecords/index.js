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
    let whereClause = {};

    // 处理筛选条件
    if (filter) {
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
    
    // 如果没有筛选条件，默认只返回最新的10条
    if (!filter || Object.keys(filter).length === 0) {
        finalQuery = finalQuery.limit(10);
    }

    const res = await finalQuery.get();
      
    return {
      success: true,
      data: res.data
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