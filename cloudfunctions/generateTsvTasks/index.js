const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 重试函数，用于在操作失败时进行重试
async function retryOperation(operation, maxRetries = 2, delay = 500) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      console.log(`操作失败，正在进行第 ${i + 1} 次重试...`, err);
      lastError = err;
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      // 每次重试增加延迟时间
      delay = delay * 1.5;
    }
  }
  throw lastError; // 如果所有重试都失败，则抛出最后一次的错误
}

// 主函数，将由定时触发器调用
exports.main = async (event, context) => {
  try {
    // 记录函数执行开始，便于调试
    console.log('generateTsvTasks 开始执行，当前时间：', new Date().toISOString());
    
    const user_collection = db.collection('Plant_user');
    const task_collection = db.collection('TSV_tasks');
    const now = new Date();
    const taskYear = now.getFullYear();
    const taskMonth = now.getMonth() + 1;

    // 1. 获取所有"访谈人"
    const interviewers = await retryOperation(async () => {
      return await user_collection.where({ '是否为访谈人': '是' }).get();
    });
    
    if (!interviewers.data.length) {
      console.log('没有找到任何需要安排任务的访谈人。');
      return { success: true, message: '没有需要安排任务的访谈人' };
    }
    console.log(`找到 ${interviewers.data.length} 名访谈人`);

    // 2. 获取所有"被访谈人"
    const interviewees = await retryOperation(async () => {
      return await user_collection.where({ '是否为被访谈人': '是' }).get();
    });
    
    if (!interviewees.data.length) {
      console.log('没有找到任何可被安排的被访谈人。');
      return { success: true, message: '没有可被安排的被访谈人' };
    }
    console.log(`找到 ${interviewees.data.length} 名被访谈人`);

    let createdCount = 0;
    const errors = [];

    // 3. 为每位访谈人创建任务
    for (const interviewer of interviewers.data) {
      try {
        // 获取访谈人的账号名
        const interviewerName = interviewer.accountName || interviewer['登录名'] || interviewer['姓名'];
        if (!interviewerName) {
          console.error('访谈人缺少账号名:', interviewer);
          errors.push({ interviewer: JSON.stringify(interviewer), error: '缺少账号名' });
          continue;
        }
        
        // 检查该访谈人本月是否已有任务，避免重复创建
        const existingTasks = await retryOperation(async () => {
          return await task_collection.where({
            accountName: interviewerName,
            taskYear: taskYear,
            taskMonth: taskMonth
          }).get();
        });

        if (existingTasks.data.length > 0) {
          console.log(`访谈人 ${interviewerName} 本月已有 ${existingTasks.data.length} 个任务，跳过。`);
          continue;
        }

        // 获取本月已经分配的被访谈人，用于避免重复
        const existingInterviewees = new Set();
        
        // 为该访谈人创建两条任务
        for (let i = 0; i < 2; i++) {
          // 随机抽取被访谈人，确保不重复
          let attempts = 0;
          let randomInterviewee;
          let intervieweeName;
          
          // 最多尝试10次找到一个未被分配的被访谈人
          while (attempts < 10) {
            randomInterviewee = interviewees.data[Math.floor(Math.random() * interviewees.data.length)];
            intervieweeName = randomInterviewee['姓名'] || randomInterviewee.name;
            
            // 检查该被访谈人是否已经被分配给当前访谈人
            if (!existingInterviewees.has(intervieweeName)) {
              break;
            }
            attempts++;
          }
          
          if (!intervieweeName) {
            console.error('被访谈人缺少姓名:', randomInterviewee);
            continue;
          }
          
          // 记录已分配的被访谈人
          existingInterviewees.add(intervieweeName);

          const newTask = {
            taskYear,
            taskMonth,
            accountName: interviewerName,
            interviewerName: interviewerName,
            interviewerDept: interviewer['部门'] || '',
            interviewerJob: interviewer['职位'] || '',
            intervieweeName: intervieweeName,
            intervieweeDept: randomInterviewee['部门'] || '',
            intervieweeJob: randomInterviewee['职位'] || '',
            status: '待完成',
            createdAt: db.serverDate(),
          };

          console.log(`正在为 ${interviewerName} 创建任务，被访谈人: ${intervieweeName}`);
          await retryOperation(async () => {
            return await task_collection.add({ data: newTask });
          });
          createdCount++;
        }
      } catch (err) {
        console.error(`为访谈人创建任务时出错:`, err);
        errors.push({ error: err.message });
      }
    }

    console.log(`任务创建完成。成功创建 ${createdCount} 条任务。`);
    if(errors.length > 0) {
        return { success: false, message: '部分任务创建失败', createdCount, errors };
    }
    return { success: true, createdCount };

  } catch (error) {
    console.error('generateTsvTasks-Error:', error);
    return {
      success: false,
      message: '任务自动生成过程出现严重错误',
      error: error.message,
    };
  }
}; 