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
      data: []
    };
  }

  try {
    // 从云数据库中获取CSV数据
    const res = await db.collection('qua_inspection_plans')
      .where({
        Project: project,
        Process: process
      })
      .get();
    
    if (res.data && res.data.length > 0) {
      // 构建巡检项目列表
      const matchingRecord = res.data[0];
      const items = [];
      
      // 从Item1到Item11遍历所有可能的巡检项
      for (let i = 1; i <= 11; i++) {
        const key = `Item${i}`;
        if (matchingRecord[key] && matchingRecord[key].trim() !== '') {
          // 移除尾部的项目代码（例如G68，P71A等）
          let itemText = matchingRecord[key];
          itemText = itemText.replace(new RegExp(`${project}$`), '').trim();
          
          items.push({
            id: i,
            name: itemText,
            isAbnormal: false,
            abnormalDesc: '',
            imageUrl: ''
          });
        }
      }
      
      return {
        success: true,
        message: '获取成功',
        data: items
      };
    } else {
      return {
        success: false,
        message: `未找到项目 ${project} 流程 ${process} 的巡检计划`,
        data: []
      };
    }
  } catch (e) {
    console.error('获取巡检计划错误:', e);
    return {
      success: false,
      message: e.message || '获取巡检计划失败',
      data: []
    };
  }
}; 