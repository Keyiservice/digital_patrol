Page({
  data: {
    tasks: [],
    isLoading: true,
  },

  onShow() {
    console.log('TSV任务列表页面显示');
    
    // 检查本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    console.log('本地用户信息:', userInfo);
    
    if (!userInfo) {
      console.warn('未找到本地用户信息，可能需要重新登录');
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟跳转到登录页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
    
    this.fetchTasks();
  },

  async fetchTasks() {
    this.setData({ isLoading: true });
    try {
      // 获取本地用户信息
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!userInfo) {
        throw new Error('无法获取本地用户信息');
      }
      
      if (!userInfo.accountName) {
        // 如果没有accountName，尝试使用name或其他可用字段
        if (userInfo.name) {
          console.log('使用name代替accountName:', userInfo.name);
          userInfo.accountName = userInfo.name;
        } else {
          throw new Error('用户信息中缺少登录名(accountName)');
        }
      }

      console.log('调用getTsvTasks云函数，参数:', { userName: userInfo.accountName });
      
      // 调用云函数获取任务列表
      const res = await wx.cloud.callFunction({
        name: 'getTsvTasks',
        data: {
          userName: userInfo.accountName
        }
      });
      
      console.log('getTsvTasks云函数返回结果:', res);
      
      if (res.result && res.result.success) {
        console.log('获取任务成功，数据:', res.result.data);
        this.setData({
          tasks: res.result.data || [],
          isLoading: false
        });
      } else {
        const errorMsg = res.result?.message || '获取任务失败，但未返回明确原因';
        console.error('获取任务失败:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('获取任务列表失败', err);
      
      // 详细记录错误信息
      if (err.errMsg) {
        console.error('错误信息:', err.errMsg);
      }
      
      this.setData({ 
        isLoading: false,
        tasks: [] // 确保设置为空数组，避免显示旧数据
      });
      
      wx.showToast({
        title: '加载任务失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  startInterview(e) {
    const task = e.currentTarget.dataset.task;
    console.log('开始访谈，任务数据:', task);
    
    // 确保任务数据有效
    if (!task || !task._id) {
      console.error('无效的任务数据:', task);
      wx.showToast({
        title: '任务数据无效',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/tsv-management/tsv-report',
      success: (res) => {
        // 通过 eventChannel 向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: task });
      },
      fail: (err) => {
        console.error('导航到报告页面失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  goToHistory() {
    wx.navigateTo({
      url: '/pages/tsv-management/tsv-history-list',
    });
  },

  goBack() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
