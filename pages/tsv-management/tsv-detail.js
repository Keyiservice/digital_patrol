Page({
  data: {
    reportId: null,
    report: null,
    isLoading: true,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ reportId: options.id });
      this.fetchReportDetail();
    } else {
      wx.showToast({ title: '无效的报告ID', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  async fetchReportDetail() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getTsvReports',
        data: { id: this.data.reportId }
      });
      
      if (res.result?.success) {
        this.setData({
          report: res.result.data,
          isLoading: false,
        });
      } else {
        throw new Error('获取报告详情失败');
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      this.setData({ isLoading: false });
    } finally {
      wx.hideLoading();
    }
  },
  
  onPreviewPhoto(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.report.photos,
      current: url
    });
  },

  goBack() {
    wx.navigateBack();
  },
});




