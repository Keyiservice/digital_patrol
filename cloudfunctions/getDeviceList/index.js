// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 默认查询 "main_inspection_plans" 集合
    const collectionName = event.collection || 'main_inspection_plans';
    
    // 获取限制条数，默认100条
    const limit = event.limit || 100;
    
    console.log(`开始查询集合: ${collectionName}, 限制: ${limit}条`);
    
    // 直接尝试查询，不检查集合是否存在
    let result;
    try {
      // 尝试使用 _id 排序（默认索引）并限制返回数量
      result = await db.collection(collectionName)
        .field({
          _id: true,
          id: true,
          machine_name: true
        })
        .limit(limit)
        .get();
    } catch (queryError) {
      console.error(`查询集合 ${collectionName} 失败:`, queryError);
      return {
        success: false,
        message: `查询失败: ${queryError.message}`,
        data: []
      };
    }
    
    // 如果没有数据，返回空数组
    if (!result || !result.data || !Array.isArray(result.data)) {
      return {
        success: true,
        data: [],
        total: 0,
        message: '没有找到设备数据'
      };
    }
    
    // 处理数据，确保字段存在
    const processedData = result.data.map(item => {
      return {
        _id: item._id || '',
        id: item.id || item._id || '', // 如果id不存在，使用_id
        machine_name: item.machine_name || '未命名设备'
      };
    });
    
    // 获取总数
    let total = processedData.length;
    try {
      const countResult = await db.collection(collectionName).count();
      total = countResult.total;
    } catch (countError) {
      console.error('获取总数失败:', countError);
      // 如果获取总数失败，使用当前数据长度作为总数
    }
    
    console.log(`查询成功，返回 ${processedData.length} 条记录，总记录数: ${total}`);
    
    return {
      success: true,
      data: processedData,
      total: total,
      message: '获取设备列表成功'
    };
  } catch (err) {
    console.error('getDeviceList云函数出错:', err);
    return {
      success: false,
      message: '获取设备列表失败: ' + (err.message || err),
      error: err.message || err,
      data: []
    };
  }
} 