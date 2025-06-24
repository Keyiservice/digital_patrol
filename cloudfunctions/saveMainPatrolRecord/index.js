// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const patrolCollection = db.collection('main_patrol_records');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    const { record } = event;

    if (!record) {
      throw new Error('缺少巡检记录数据');
    }

    // 为记录添加创建时间、更新时间和操作者 openid
    const time = new Date();
    record.createdAt = time;
    record.updatedAt = time;
    record._openid = wxContext.OPENID;

    // 插入数据到数据库
    const result = await patrolCollection.add({
      data: record,
    });

    return {
      success: true,
      id: result._id,
      message: '巡检记录保存成功'
    };

  } catch (error) {
    console.error('保存巡检记录失败:', error);
    return {
      success: false,
      message: error.message || '保存失败，请查看云函数日志'
    };
  }
}; 