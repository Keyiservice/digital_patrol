const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { id, ...data } = event;
    const collection = db.collection('unsafe_records');
    const wxContext = cloud.getWXContext();

    if (id) {
      // 更新记录
      await collection.doc(id).update({
        data: {
          ...data,
          updatedAt: db.serverDate(),
          updater: wxContext.OPENID,
        },
      });
      return { success: true, id };
    } else {
      // 新增记录
      const result = await collection.add({
        data: {
          ...data,
          reporterId: wxContext.OPENID,
          createdAt: db.serverDate(),
          status: 'open', // 初始状态为开放
        },
      });
      return { success: true, id: result._id };
    }
  } catch (error) {
    console.error('保存不安全记录失败:', error);
    return {
      success: false,
      message: '保存失败',
      error: error,
    };
  }
}; 