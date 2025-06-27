// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const patrolCollection = db.collection('main_patrol_records');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { filter = {} } = event;

  try {
    // 构建查询条件
    let query = {
      _openid: wxContext.OPENID // 只获取当前用户创建的记录
    };
    
    // 如果传入了 _id，则优先使用 _id 查询
    if (filter._id) {
      query._id = filter._id;
    } else {
      // 添加日期筛选
      if (filter.startDate && filter.endDate) {
        // 日期格式化，确保使用 / 作为分隔符
        const startDate = filter.startDate.replace(/-/g, '/');
        const endDate = filter.endDate.replace(/-/g, '/');

        // 如果开始日期和结束日期相同，则查询当天的记录
        if (startDate === endDate) {
          const startDateStr = startDate + ' 00:00:00';
          const endDateStr = endDate + ' 23:59:59';
          
          query.inspectionTime = _.gte(startDateStr).and(_.lte(endDateStr));
        } else {
          // 如果开始日期和结束日期不同，则查询日期范围内的记录
          const startDateStr = startDate + ' 00:00:00';
          const endDateStr = endDate + ' 23:59:59';
          
          query.inspectionTime = _.gte(startDateStr).and(_.lte(endDateStr));
        }
      } else if (filter.startDate) {
        // 只有开始日期
        const startDate = filter.startDate.replace(/-/g, '/');
        const startDateStr = startDate + ' 00:00:00';
        query.inspectionTime = _.gte(startDateStr);
      } else if (filter.endDate) {
        // 只有结束日期
        const endDate = filter.endDate.replace(/-/g, '/');
        const endDateStr = endDate + ' 23:59:59';
        query.inspectionTime = _.lte(endDateStr);
      }
      
      // 添加设备ID筛选
      if (filter.deviceId) {
        query.deviceId = filter.deviceId;
      }
    }
    
    // 查询数据
    const res = await patrolCollection
      .where(query)
      .orderBy('createdAt', 'desc') // 按创建时间降序排列
      .get();
    
    return {
      success: true,
      data: res.data
    };
  } catch (error) {
    console.error('获取巡检记录失败:', error);
    return {
      success: false,
      message: '获取失败',
      error: error
    };
  }
}; 