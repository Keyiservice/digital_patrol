const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { filter, id, currentUser, dateRange } = event;
    const collection = db.collection('TSV_REPORT');

    // 如果是获取单条详情
    if (id) {
      const record = await collection.doc(id).get();
      return { success: true, data: record.data };
    }

    // 构建筛选查询条件
    let query = {};
    
    // 如果指定了日期范围，则按日期范围筛选
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      // 确保时间包含整天
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      query.submitTime = _.gte(startDate).and(_.lte(endDate));
    }
    
    // 如果指定了当前用户且没有其他筛选条件，默认只显示当前用户的记录
    if (currentUser && (!filter || (!filter.interviewerName && !filter.accountName && filter.interviewerName !== '' && filter.accountName !== ''))) {
      query.interviewerName = currentUser;
    }
    
    // 应用其他筛选条件
    if (filter) {
      // 处理访谈人筛选 - 支持interviewerName和accountName两种字段
      if (filter.interviewerName !== undefined) {
        // 如果不是"全部"选项，则应用筛选
        if (filter.interviewerName) {
          query.interviewerName = filter.interviewerName;
        }
        // 如果是空字符串或null，则不筛选访谈人（显示全部）
      }
      
      // 处理accountName筛选（新增）
      if (filter.accountName !== undefined) {
        if (filter.accountName) {
          // 使用或条件，同时查询interviewerName和accountName字段
          query = _.or([
            { interviewerName: filter.accountName },
            { accountName: filter.accountName }
          ]);
        }
      }
      
      if (filter.month) {
        // month 的格式应为 "YYYY-MM"
        const year = parseInt(filter.month.split('-')[0]);
        const month = parseInt(filter.month.split('-')[1]);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); // 月份从0开始，所以月份为month
        query.date = _.gte(startDate.toISOString()).and(_.lte(endDate.toISOString()));
      }
    }

    console.log('查询条件:', query);
    const reports = await collection.where(query).orderBy('submitTime', 'desc').get();

    return {
      success: true,
      data: reports.data,
    };

  } catch (error) {
    console.error('getTsvReports-Error:', error);
    return {
      success: false,
      message: '获取报告失败',
      error: error.message,
    };
  }
}; 