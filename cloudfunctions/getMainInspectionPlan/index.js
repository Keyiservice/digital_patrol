// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { deviceId } = event;
  console.log('接收到设备ID:', deviceId);
  
  if (!deviceId) {
    return { success: false, message: '缺少设备ID参数' };
  }

  // 将deviceId转换为数字，因为数据库中存储的是数字类型
  const numericId = parseInt(deviceId);
  
  if (isNaN(numericId)) {
    return {
      success: false,
      message: '设备ID必须是数字',
      providedId: deviceId
    };
  }

  console.log('转换后的查询ID:', numericId);

  try {
    // 查询设备对应的巡检计划
    const planResult = await db.collection('main_inspection_plans').where({
      id: numericId
    }).get();

    if (planResult.data.length === 0) {
      return {
        success: false,
        message: `在 "main_inspection_plans" 集合中未找到ID为 ${numericId} 的设备`
      };
    }

    const planData = planResult.data[0];
    console.log('从数据库获取的原始数据:', JSON.stringify(planData));
    
    // 转换数据结构为前端所需格式
    const inspectionItems = [];
    
    // 遍历check_1到check_15字段，提取巡检项目
    for (let i = 1; i <= 15; i++) {
      const checkField = `check_${i}`;
      const itemContent = planData[checkField];

      // 增加安全检查：确保字段存在，是字符串，并且不是空的
      if (itemContent && typeof itemContent === 'string' && itemContent.trim() !== '') {
        inspectionItems.push({
          id: checkField,
          name: '巡检项目',
          type: 'select',
          label: itemContent.trim(),
          options: ['正常', '异常'],
          standardValue: '正常'
        });
      }
    }
    
    console.log('处理后的巡检项:', JSON.stringify(inspectionItems));

    // 构建返回的巡检计划数据
    const plan = {
      deviceId: planData.id,
      deviceName: planData.machine_name,
      deviceType: '设备巡检',
      department: '维护部',
      inspectionAreas: [planData.machine_name],
      inspectionItems: {
        [planData.machine_name]: inspectionItems
      }
    };

    return { success: true, data: plan };

  } catch (err) {
    console.error('获取巡检计划失败，发生异常:', err);
    return {
      success: false,
      message: '获取巡检计划时发生错误，请检查云函数日志。',
      error: err.message
    };
  }
} 