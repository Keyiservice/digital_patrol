// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const tpmCollection = db.collection('tpm_records')

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { filter } = event;
    let query = tpmCollection;

    if (filter && Object.keys(filter).length > 0) {
      const whereClause = {};
      if (filter.tpm_type) whereClause.tpm_type = filter.tpm_type;
      if (filter.device_id) whereClause.device_id = filter.device_id;
      if (filter.startDate && filter.endDate) {
        whereClause.timestamp = _.gte(new Date(filter.startDate)).and(_.lte(new Date(filter.endDate + 'T23:59:59.999Z')));
      } else if (filter.startDate) {
        whereClause.timestamp = _.gte(new Date(filter.startDate));
      } else if (filter.endDate) {
        whereClause.timestamp = _.lte(new Date(filter.endDate + 'T23:59:59.999Z'));
      }
      query = query.where(whereClause).orderBy('timestamp', 'desc');
    } else {
      query = query.orderBy('timestamp', 'desc').limit(10);
    }

    const res = await query.get();
    
    return {
      success: true,
      data: res.data
    };
  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: '获取TPM记录失败: ' + e.message,
      error: e
    }
  }
} 