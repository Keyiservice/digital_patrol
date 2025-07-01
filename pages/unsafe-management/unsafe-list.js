const util = require('../../utils/util.js');

Page({
  data: {
    records: []
  },

  onShow() {
    this.fetchRecords();
  },

  fetchRecords() {
    wx.showLoading({ title: '加载中...' });
    // ToDo: replace with actual cloud function name
    wx.cloud.callFunction({
      name: 'getUnsafeRecords', 
      data: {},
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          // format date
          let records = res.result.data;
          records.forEach(r => {
            if (r.date) {
              r.date = util.formatDate(new Date(r.date));
            }
          })
          this.setData({ records: records });
        } else {
          this.setData({ records: [] });
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ records: [] });
        wx.showToast({ title: '请求失败', icon: 'none' });
        console.error("failed to call getUnsafeRecords", err)
      }
    });
  },
  
  onAddNew() {
    wx.navigateTo({ url: '/pages/unsafe-management/unsafe-report' });
  },

  onBack() {
    wx.navigateBack();
  },

  onViewRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/unsafe-management/unsafe-detail?id=${id}` });
  },
});
