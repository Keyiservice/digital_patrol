// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { id, filter } = event; // 接收筛选对象
    
    let query = db.collection('qua_patrol_records');
    let whereClause = {};

    // 场景一：按ID查询单条记录
    if (id) {
      whereClause = { _id: id };
      query = query.where(whereClause);
    } 
    // 场景二：按条件筛选
    else if (filter && Object.keys(filter).length > 0) {
      if (filter.process) whereClause.process = _.all.includes([filter.process]);
      if (filter.project) whereClause.project = _.all.includes([filter.project]);
      if (filter.tNumber) whereClause.tNumber = _.all.includes([filter.tNumber]);
      if (filter.inspector) whereClause.inspector = _.all.includes([filter.inspector]);
      if (filter.startDate && filter.endDate) {
        whereClause.inspectionTime = _.gte(filter.startDate).and(_.lte(filter.endDate + ' 23:59:59'));
      } else if (filter.startDate) {
        whereClause.inspectionTime = _.gte(filter.startDate);
      } else if (filter.endDate) {
        whereClause.inspectionTime = _.lte(filter.endDate + ' 23:59:59');
      }
      query = query.where(whereClause).orderBy('inspectionTime', 'desc');
    }
    // 场景三：默认加载
    else {
      query = query.orderBy('inspectionTime', 'desc').limit(10);
    }

    const res = await query.get();

    if (id && res.data.length === 0) {
      return { success: false, message: '未找到指定ID的记录', data: null };
    }

    return {
      success: true,
      data: id ? res.data[0] : res.data
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: '数据库查询失败'
    };
  }
} 