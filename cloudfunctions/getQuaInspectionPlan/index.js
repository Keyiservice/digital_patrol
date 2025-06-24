// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { project, process } = event;

  if (!project || !process) {
    return {
      success: false,
      message: '缺少项目或过程参数',
      data: null
    };
  }

  try {
    const res = await db.collection('qua_inspection_plans')
      .where({
        project: project,
        process: process
      })
      .get();
    
    if (res.data && res.data.length > 0) {
      // 假设每个组合只有一份计划，取第一份
      return {
        success: true,
        message: '获取成功',
        data: res.data[0].items // 返回计划中的巡检项数组
      };
    } else {
      return {
        success: false,
        message: '未找到匹配的巡检计划',
        data: []
      };
    }

  } catch (e) {
    return {
      success: false,
      message: e.message,
      data: null
    };
  }
}; 