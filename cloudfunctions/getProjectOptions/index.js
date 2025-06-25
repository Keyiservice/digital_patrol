// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 1. 使用基础的 get() 命令，只获取 "Project" 字段
    const res = await db.collection('qua_inspection_plans').field({
      Project: true
    }).limit(1000).get();

    if (res && res.data) {
      // 2. 在云函数内手动去重
      const projectSet = new Set(res.data.map(item => item.Project));
      const uniqueProjects = Array.from(projectSet);

      return {
        success: true,
        data: uniqueProjects.sort() // 按字母顺序排序
      };
    } else {
      return {
        success: false,
        message: '未找到任何项目记录'
      };
    }
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: '数据库查询失败'
    };
  }
} 