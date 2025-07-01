const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 主函数
exports.main = async (event, context) => {
  try {
    const { userName } = event; // 从 event 中直接获取 userName

    if (!userName) {
      throw new Error('请求中缺少用户名');
    }

    // 直接使用用户名查询 TSV_tasks
    const tasksResult = await db.collection('TSV_tasks')
      .where({
        accountName: userName, // 使用正确的字段名 accountName
        status: '待完成'
      })
      .get();

    return {
      success: true,
      data: tasksResult.data,
    };
  } catch (error) {
    console.error('getTsvTasks-Error:', error);
    return {
      success: false,
      message: '获取任务失败',
      error: error.message,
    };
  }
}; 