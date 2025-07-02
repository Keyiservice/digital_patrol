const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 主函数
exports.main = async (event, context) => {
  try {
    const { userName } = event; // 从 event 中直接获取 userName

    console.log('getTsvTasks调用参数:', event);

    if (!userName) {
      throw new Error('请求中缺少用户名');
    }

    // 查询待完成的TSV任务
    console.log('开始查询TSV任务，用户名:', userName);
    
    // 查询TSV_tasks集合
    const tasksResult = await db.collection('TSV_tasks')
      .where({
        accountName: userName,
        status: '待完成'
      })
      .get();
      
    console.log('查询到的任务数据:', tasksResult.data);

    // 如果没有找到任务，直接返回空数组
    if (!tasksResult.data || tasksResult.data.length === 0) {
      return {
        success: true,
        data: [],
        message: '没有待完成的任务'
      };
    }

    // 获取访谈人信息
    let userInfo = { department: '未知部门', position: '未知职位' };
    try {
      console.log('从Plant_user集合获取访谈人信息，用户名:', userName);
      const userResult = await db.collection('Plant_user')
        .where({
          accountName: userName
        })
        .get();
      
      console.log('访谈人信息查询结果:', userResult.data);
      
      if (userResult.data && userResult.data.length > 0) {
        userInfo = userResult.data[0];
      }
    } catch (userError) {
      console.error('获取访谈人信息失败，继续使用默认值:', userError);
    }

    // 为每个任务添加访谈人信息
    const tasks = tasksResult.data.map(task => {
      return {
        ...task,
        interviewerName: task.interviewerName || userInfo.name || userName,
        interviewerDept: task.interviewerDept || userInfo.department || '未知部门',
        interviewerJob: task.interviewerJob || userInfo.position || '未知职位',
      };
    });

    // 获取所有被访谈人账号
    const intervieweeAccounts = tasks
      .map(task => task.intervieweeAccountName)
      .filter(Boolean);
      
    console.log('需要获取信息的被访谈人账号:', intervieweeAccounts);
    
    // 如果有被访谈人账号，获取他们的信息
    let intervieweeInfoMap = {};
    if (intervieweeAccounts.length > 0) {
      try {
        const intervieweeResult = await db.collection('Plant_user')
          .where({
            accountName: db.command.in(intervieweeAccounts)
          })
          .get();
          
        console.log('被访谈人信息查询结果:', intervieweeResult.data);
        
        // 创建账号到信息的映射
        intervieweeInfoMap = intervieweeResult.data.reduce((map, user) => {
          if (user.accountName) {
            map[user.accountName] = user;
          }
          return map;
        }, {});
      } catch (error) {
        console.error('获取被访谈人信息失败:', error);
      }
    }
    
    // 更新任务中的被访谈人信息
    const enrichedTasks = tasks.map(task => {
      if (task.intervieweeAccountName && intervieweeInfoMap[task.intervieweeAccountName]) {
        const intervieweeInfo = intervieweeInfoMap[task.intervieweeAccountName];
        return {
          ...task,
          intervieweeDept: task.intervieweeDept || intervieweeInfo.department || '未知部门',
          intervieweeJob: task.intervieweeJob || intervieweeInfo.position || '未知职位'
        };
      }
      return task;
    });

    return {
      success: true,
      data: enrichedTasks,
    };
  } catch (error) {
    console.error('getTsvTasks-Error:', error);
    return {
      success: false,
      message: '获取任务失败: ' + error.message,
      error: error.message,
    };
  }
}; 