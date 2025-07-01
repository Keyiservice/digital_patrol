const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { id } = event;
    if (!id) {
      throw new Error('缺少记录ID');
    }
    const collection = db.collection('unsafe_records');
    
    // ToDo: 在删除数据库记录前，需要先删除云存储中的关联照片
    
    await collection.doc(id).remove();
    
    return {
      success: true,
      message: '删除成功',
    };
  } catch (error) {
    console.error('删除不安全记录失败:', error);
    return {
      success: false,
      message: '删除失败',
      error: error.message,
    };
  }
}; 