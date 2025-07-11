// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 使用聚合操作来获取不重复的字段值
    const projectResult = await db.collection('qua_patrol_records').aggregate()
      .group({
        _id: '$project',
      })
      .project({
        _id: 0,
        name: '$_id'
      })
      .end();

    const processResult = await db.collection('qua_patrol_records').aggregate()
      .group({
        _id: '$process',
      })
      .project({
        _id: 0,
        name: '$_id'
      })
      .end();

    const projects = projectResult.list.map(item => item.name).filter(Boolean); // 过滤掉null或空值
    const processes = processResult.list.map(item => item.name).filter(Boolean);

    return {
      success: true,
      data: {
        projects,
        processes
      }
    };
  } catch (e) {
    console.error('获取筛选选项失败', e);
    return {
      success: false,
      message: '获取选项失败'
    };
  }
} 