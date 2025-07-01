const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { filter, id, currentUser } = event;
    const collection = db.collection('TSV_REPORT');

    // 如果是获取单条详情
    if (id) {
      const record = await collection.doc(id).get();
      return { success: true, data: record.data };
    }

    // 构建筛选查询条件
    let query = {};
    
    // 如果指定了当前用户且没有其他筛选条件，默认只显示当前用户的记录
    if (currentUser && (!filter || (!filter.interviewerName && filter.interviewerName !== ''))) {
      query.interviewerName = currentUser;
    }
    
    // 应用其他筛选条件
    if (filter) {
      // 如果明确指定了访谈人名称（包括空字符串，表示重置筛选）
      if (filter.interviewerName !== undefined) {
        // 如果不是"全部"选项，则应用筛选
        if (filter.interviewerName) {
          query.interviewerName = filter.interviewerName;
        }
        // 如果是空字符串或null，则不筛选访谈人（显示全部）
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