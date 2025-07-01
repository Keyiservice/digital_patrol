Page({
  data: {
    tasks: [],
    isLoading: true,
  },

  onShow() {
    this.fetchTasks();
  },

  async fetchTasks() {
    this.setData({ isLoading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.accountName) {
        throw new Error('无法获取本地用户信息或缺少登录名');
      }

      const res = await wx.cloud.callFunction({
        name: 'getTsvTasks',
        data: {
          userName: userInfo.accountName // 使用正确的键 "accountName"
        }
      });
      if (res.result && res.result.success) {
        this.setData({
          tasks: res.result.data,
          isLoading: false
        });
      } else {
        throw new Error(res.result?.message || '获取任务失败，但未返回明确原因');
      }
    } catch (err) {
      console.error('获取任务列表失败', err);
      if (err.result) {
        console.error('云函数返回的详细错误:', err.result);
      }
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载任务失败',
        icon: 'none'
      });
    }
  },

  startInterview(e) {
    const task = e.currentTarget.dataset.task;
    wx.navigateTo({
      url: '/pages/tsv-management/tsv-report',
      success: (res) => {
        // 通过 eventChannel 向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: task });
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
