const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { id } = event;
    const collection = db.collection('unsafe_records');

    if (id) {
      // 如果提供了ID，则获取单个记录
      const record = await collection.doc(id).get();
      return {
        success: true,
        data: record.data,
      };
    } else {
      // 否则，获取所有记录，按日期降序排序
      const records = await collection.orderBy('date', 'desc').get();
      return {
        success: true,
        data: records.data,
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