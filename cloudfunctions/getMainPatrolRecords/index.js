// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const patrolCollection = db.collection('main_patrol_records');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { filter = {}, limit } = event;

  // 记录调用参数，便于调试
  console.log('getMainPatrolRecords调用参数:', { filter, limit, openid: wxContext.OPENID });

  try {
    // 构建查询条件
    let query = {
      _openid: wxContext.OPENID // 只获取当前用户创建的记录
    };
    
    // 如果传入了 _id，则优先使用 _id 查询
    if (filter && filter._id) {
      query._id = filter._id;
    } else if (filter) {
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
    
    console.log('最终查询条件:', query);
    
    // 创建查询对象
    let queryObj = patrolCollection
      .where(query)
      .orderBy('createdAt', 'desc'); // 按创建时间降序排列
    
    // 如果指定了limit，则限制返回记录数量
    if (limit && !isNaN(parseInt(limit))) {
      const limitNum = parseInt(limit);
      console.log(`应用limit限制: ${limitNum}条`);
      queryObj = queryObj.limit(limitNum);
    } else {
      console.log('未指定limit或limit无效，返回全部记录');
    }
    
    // 获取总数
    const countResult = await patrolCollection.where(query).count();
    const total = countResult.total;
    console.log(`符合条件的记录总数: ${total}条`);
    
    // 执行查询
    const res = await queryObj.get();
    console.log(`实际返回记录数: ${res.data.length}条`);
    
    return {
      success: true,
      data: res.data,
      total: total,
      query: query, // 返回查询条件，便于调试
      limitApplied: limit ? parseInt(limit) : null
    };
  } catch (error) {
    console.error('获取巡检记录失败:', error);
    return {
      success: false,
      message: '获取失败',
      error: error.message || error
    };
  }
}; 