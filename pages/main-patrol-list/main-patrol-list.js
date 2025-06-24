Page({
  data: {
    records: [],
    isLoading: false,
  },

  onShow() {
    this.getRecords();
  },

  getRecords() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    wx.cloud.callFunction({
      name: 'getMainPatrolRecords',
      success: res => {
        if (res.result.success) {
          // 在前端简单处理一下，判断是否存在异常项
          const records = res.result.data.map(record => {
            record.hasAbnormal = record.items.some(item => item.isAbnormal);
            return record;
          });
          this.setData({ records });
        } else {
          wx.showToast({ title: '加载失败', icon: 'error' });
        }
      },
      fail: err => {
        wx.showToast({ title: '调用失败', icon: 'error' });
        console.error(err);
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  onPullDownRefresh() {
    this.getRecords();
  },

  goBack() {
    wx.navigateBack();
  }
}); 