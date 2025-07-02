const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { isInterviewer, isInterviewee, accountName } = event;
    const collection = db.collection('Plant_user');
    
    console.log('getPlantUsers调用参数:', event);
    
    let query = {};
    
    // 如果提供了accountName，优先按账号名查询
    if (accountName) {
      // 尝试多种可能的字段名
      query = {
        $or: [
          { '登录名': accountName },
          { 'accountName': accountName },
          { '姓名': accountName },
          { 'name': accountName }
        ]
      };
    } else {
      // 否则按角色筛选
      if (isInterviewer) {
        query['是否为访谈人'] = '是';
      }
      if (isInterviewee) {
        query['是否为被访谈人'] = '是';
      }
    }
    
    console.log('查询用户，账号名:', accountName);
    console.log('查询条件:', query);
    
    const users = await collection.where(query).get();
    console.log('查询结果原始数据:', users.data);
    
    // 统一字段名，方便前端使用
    const formattedUsers = users.data.map(user => {
      // 尝试获取部门信息，可能的字段名有：部门、department
      const department = user['部门'] || user.department || user['部门名称'] || '未知部门';
      
      // 尝试获取职位信息，可能的字段名有：职位、position
      const position = user['职位'] || user.position || user['职位名称'] || '未知职位';
      
      console.log(`用户 ${user['姓名'] || user.name || accountName} 的部门信息:`, department);
      
      return {
        _id: user._id,
        name: user['姓名'] || user.name || user['登录名'] || user.accountName,
        accountName: user['登录名'] || user.accountName || user['姓名'] || user.name,
        department: department,
        position: position,
        // 保留原始字段，方便调试
        rawData: {
          部门字段: user['部门'],
          department字段: user.department,
          职位字段: user['职位'],
          position字段: user.position
        }
      };
    });

    return {
      success: true,
      data: formattedUsers,
    };

  } catch (error) {
    console.error('getPlantUsers-Error:', error);
    return {
      success: false,
      message: '获取用户列表失败',
      error: error.message,
    };
  }
}; 