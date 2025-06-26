// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 默认的不合格原因列表
const defaultReasons = [
  { reason: 'Shape Defect', description: '形状缺陷' },
  { reason: 'Size Issue', description: '尺寸问题' },
  { reason: 'Surface Defect', description: '表面缺陷' },
  { reason: 'Color Issue', description: '颜色问题' },
  { reason: 'Material Problem', description: '材料问题' },
  { reason: 'Assembly Error', description: '装配错误' },
  { reason: 'Other', description: '其他' }
];

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    // 先检查集合是否存在，如果不存在则创建
    try {
      await db.createCollection('reasons');
      console.log('成功创建reasons集合');
    } catch (e) {
      // 集合已存在，继续执行
      console.log('reasons集合已存在');
    }
    
    // 清空现有数据
    if (event.clearExisting) {
      try {
        await db.collection('reasons').where({}).remove();
        console.log('清空现有不合格原因数据');
      } catch (e) {
        console.error('清空数据失败:', e);
      }
    }
    
    // 添加默认不合格原因
    for (const item of defaultReasons) {
      // 检查是否已存在
      const exists = await db.collection('reasons').where({
        reason: item.reason
      }).get();
      
      if (exists.data.length === 0) {
        await db.collection('reasons').add({
          data: {
            ...item,
            createdBy: wxContext.OPENID,
            createdAt: db.serverDate()
          }
        });
      }
    }
    
    // 添加自定义的不合格原因
    if (event.customReasons && Array.isArray(event.customReasons)) {
      for (const reason of event.customReasons) {
        if (typeof reason === 'string') {
          const exists = await db.collection('reasons').where({
            reason: reason
          }).get();
          
          if (exists.data.length === 0) {
            await db.collection('reasons').add({
              data: {
                reason: reason,
                description: '',
                createdBy: wxContext.OPENID,
                createdAt: db.serverDate()
              }
            });
          }
        }
      }
    }
    
    // 获取所有不合格原因
    const result = await db.collection('reasons').get();
    
    return {
      success: true,
      message: '不合格原因初始化成功',
      data: result.data
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: '初始化不合格原因失败: ' + e.message,
      error: e
    };
  }
} 