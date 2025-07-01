const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { taskId, reportData } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!taskId || !reportData) {
    return { success: false, message: '缺少关键参数' };
  }

  // 使用事务来确保数据一致性
  const transaction = await db.startTransaction();
  try {
    // 1. 在 TSV_REPORT 集合中创建新报告
    const reportCollection = transaction.collection('TSV_REPORT');
    const newReport = await reportCollection.add({
      data: {
        ...reportData,
        _openid: openid, // 记录是谁提交的
        submitTime: db.serverDate()
      }
    });

    // 2. 更新 TSV_tasks 集合中的任务状态
    const tasksCollection = transaction.collection('TSV_tasks');
    await tasksCollection.doc(taskId).update({
      data: {
        status: '已完成',
        reportId: newReport._id, // 关联报告ID
        completionTime: db.serverDate()
      }
    });

    // 提交事务
    await transaction.commit();

    return {
      success: true,
      reportId: newReport._id
    };

  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('saveTsvReport-Error:', error);
    return {
      success: false,
      message: '提交失败',
      error: error,
    };
  }
}; 