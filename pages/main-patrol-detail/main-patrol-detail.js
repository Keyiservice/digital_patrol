const util = require('../../utils/util.js');

Page({
  data: {
    record: null,
    scrollHeight: 0
  },

  onLoad(options) {
    if (options.id) {
      this.loadRecord(options.id);
    } else {
      wx.showToast({
        title: '无效的记录ID',
        icon: 'error',
        complete: () => wx.navigateBack()
      });
    }
  },

  loadRecord(recordId) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getMainPatrolRecords',
      data: { filter: { _id: recordId } },
      success: res => {
        if (res.result.success && res.result.data.length > 0) {
          this.setData({
            record: res.result.data[0]
          }, () => {
            this.calculateScrollViewHeight();
          });
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'error',
            complete: () => wx.navigateBack()
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '请求失败',
          icon: 'error',
          complete: () => wx.navigateBack()
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  calculateScrollViewHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;

    const query = wx.createSelectorQuery();
    query.select('#inspection-header').boundingClientRect();
    query.select('#bottom-section').boundingClientRect();
    query.exec(res => {
      if (res && res[0] && res[1]) {
        const topHeight = res[0].height;
        const bottomHeight = res[1].height;
        const scrollHeight = windowHeight - topHeight - bottomHeight;
        
        this.setData({
          scrollHeight: scrollHeight
        });
      }
    });
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      wx.previewImage({
        urls: [url]
      });
    }
  },

  goBack() {
    wx.navigateBack();
  }
}); 