Page({
  data: {
    records: [], // 原始记录
    filteredRecords: [], // 筛选后的记录
    loading: false,
    isRefreshing: false,
    // 筛选条件
    filterProcess: '',
    filterProject: '',
    filterTNumber: '',
    filterInspector: '',
    startDate: '',
    endDate: ''
  },

  onLoad: function (options) {
    this.loadRecords();
  },

  onPullDownRefresh: function () {
    this.setData({ isRefreshing: true });
    this.loadRecords();
  },

  loadRecords: function(filter = null) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    wx.showLoading({ title: '加载中...' });

    wx.cloud.callFunction({
      name: 'getQuaPatrolRecords',
      data: { filter: filter },
      success: res => {
        if (res.result.success) {
          this.setData({
            records: res.result.data,
            filteredRecords: res.result.data // 默认显示所有记录
          });
        } else {
          wx.showToast({
            title: res.result.message || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
        console.error("请求云函数失败: ", err);
      },
      complete: () => {
        this.setData({ loading: false, isRefreshing: false });
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    });
  },

  // 输入框变化
  onFilterInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 日期选择变化
  onDateChange: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 筛选按钮点击
  onFilter: function() {
    const filter = {
      process: this.data.filterProcess,
      project: this.data.filterProject,
      tNumber: this.data.filterTNumber,
      inspector: this.data.filterInspector,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    
    // 移除值为空的字段，避免传递空字符串
    Object.keys(filter).forEach(key => {
      if (!filter[key]) {
        delete filter[key];
      }
    });

    this.loadRecords(filter);
  },

  // 重置按钮点击
  onReset: function() {
    this.setData({
      filteredRecords: this.data.records,
      filterProcess: '',
      filterProject: '',
      filterTNumber: '',
      filterInspector: '',
      startDate: '',
      endDate: ''
    });
    this.loadRecords();
  },

  viewRecord: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/qua-inspection/qua-inspection?id=${id}`
    });
  },

  onBack: function() {
    wx.navigateBack();
  }
}); 