const util = require('../../utils/util.js');

Page({
  data: {
    records: [],
    isFirstLoad: true,  // 标记是否首次加载
    showLoadMore: false, // 是否显示加载更多按钮
    totalRecords: 0 // 记录总数
  },

  onShow() {
    // 首次加载默认显示最近10条记录
    if (this.data.isFirstLoad) {
      this.fetchRecords(null, 10);
    }
  },

  fetchRecords(filter = null, limit = null) {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getUnsafeRecords', 
      data: { filter, limit },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          // format date
          let records = res.result.data;
          records.forEach(r => {
            if (r.date) {
              r.date = util.formatDate(new Date(r.date));
            }
          });
          
          const hasMoreRecords = res.result.total > records.length;
          
          this.setData({ 
            records: records,
            isFirstLoad: false,
            showLoadMore: limit && hasMoreRecords, // 如果有限制且还有更多记录，则显示加载更多按钮
            totalRecords: res.result.total || 0
          });
        } else {
          this.setData({ 
            records: [],
            showLoadMore: false
          });
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ 
          records: [],
          showLoadMore: false
        });
        wx.showToast({ title: '请求失败', icon: 'none' });
        console.error("failed to call getUnsafeRecords", err);
      }
    });
  },
  
  // 加载所有记录
  loadAllRecords() {
    this.fetchRecords();
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

