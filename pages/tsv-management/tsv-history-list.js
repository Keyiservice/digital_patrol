Page({
  data: {
    reports: [],
    isLoading: true,
    currentUser: '',
    isFirstLoad: true,  // 标记是否首次加载
    showLoadMore: false, // 是否显示加载更多按钮
    
    // 筛选条件
    filterMonth: '',
    interviewerList: [{_id: 'all', name: '全部访谈人', accountName: '全部访谈人'}], // 默认值
    interviewerIndex: 0,
  },

  onLoad() {
    // 获取当前登录用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ currentUser: userInfo.name || userInfo.accountName });
    }
    this.fetchInitialData(true); // 首次加载只显示前一天的数据
  },

  async fetchInitialData(onlyRecentDay = false) {
    this.setData({ isLoading: true });
    
    // 计算日期范围
    let dateRange = null;
    if (onlyRecentDay) {
      // 获取前一天的日期范围
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      // 前一天的0点到今天的23:59:59
      dateRange = {
        start: yesterday.toISOString(),
        end: today.toISOString()
      };
    }
    
    // Promise.all 可以并行处理两个独立的请求
    try {
      const [reportsRes, interviewersRes] = await Promise.all([
        wx.cloud.callFunction({ 
          name: 'getTsvReports', 
          data: { 
            currentUser: this.data.currentUser,
            dateRange: dateRange
          } 
        }),
        wx.cloud.callFunction({ 
          name: 'getPlantUsers', 
          data: { isInterviewer: true } 
        })
      ]);

      if (reportsRes.result?.success) {
        this.setData({ 
          reports: reportsRes.result.data,
          isFirstLoad: false,
          showLoadMore: onlyRecentDay && reportsRes.result.data.length > 0 // 如果是首次加载且有数据，则显示加载更多按钮
        });
      } else {
        throw new Error('获取报告失败');
      }

      if (interviewersRes.result?.success && interviewersRes.result.data.length > 0) {
        // 确保访谈人列表包含"全部"选项和数据库中的访谈人
        this.setData({
          interviewerList: [{_id: 'all', name: '全部访谈人', accountName: '全部访谈人'}].concat(interviewersRes.result.data)
        });
      } else {
        throw new Error('获取访谈人列表失败');
      }

    } catch (err) {
      console.error(err);
      wx.showToast({ title: '数据加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 加载所有历史记录
  loadAllRecords() {
    this.fetchInitialData(false);
  },

  async fetchReports() {
    this.setData({ isLoading: true });
    const selectedInterviewer = this.data.interviewerList[this.data.interviewerIndex];
    const filter = {
      month: this.data.filterMonth,
      accountName: selectedInterviewer._id === 'all' ? '' : selectedInterviewer.accountName,
    };
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getTsvReports',
        data: { 
          filter,
          currentUser: selectedInterviewer._id === 'all' ? '' : this.data.currentUser
        }
      });
      if (res.result?.success) {
        this.setData({ 
          reports: res.result.data,
          showLoadMore: false // 筛选后不显示加载更多按钮
        });
      } else {
        throw new Error('筛选失败');
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '筛选失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  onMonthChange(e) {
    this.setData({ filterMonth: e.detail.value });
    // 不立即触发筛选，等用户点击"筛选"按钮
  },
  
  onInterviewerChange(e) {
    this.setData({ interviewerIndex: e.detail.value });
    // 不立即触发筛选，等用户点击"筛选"按钮
  },
  
  onResetFilter() {
    this.setData({
      filterMonth: '',
      interviewerIndex: 0
    });
    // 重置后，显示当前登录用户的记录
    wx.cloud.callFunction({ 
      name: 'getTsvReports', 
      data: { currentUser: this.data.currentUser } 
    }).then(res => {
      if (res.result?.success) {
        this.setData({ 
          reports: res.result.data,
          isLoading: false,
          showLoadMore: false // 重置后不显示加载更多按钮
        });
      }
    }).catch(err => {
      console.error(err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '重置失败', icon: 'none' });
    });
  },
  
  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/tsv-management/tsv-detail?id=${id}`
    });
  },

  goBack(){
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },
  
  goToTaskList() {
    wx.navigateTo({
      url: '/pages/tsv-management/tsv-task-list'
    });
  }
});
