// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 从reasons集合中获取所有原因选项
    const res = await db.collection('reasons').get();

    if (res && res.data) {
      // 提取reason字段并去重
      const reasonSet = new Set(res.data.map(item => item.reason));
      const uniqueReasons = Array.from(reasonSet);

      return {
        success: true,
        data: uniqueReasons.sort() // 按字母顺序排序
      };
    } else {
      // 如果没有找到数据，返回默认选项列表
      return {
        success: true,
        data: ['Shape Defect', 'Size Issue', 'Surface Defect', 'Color Issue', 'Material Problem', 'Assembly Error', 'Other']
      };
    }
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: '数据库查询失败',
      data: ['Shape Defect', 'Size Issue', 'Surface Defect', 'Color Issue', 'Material Problem', 'Assembly Error', 'Other'] // 故障时返回默认列表
    };
  }
} 