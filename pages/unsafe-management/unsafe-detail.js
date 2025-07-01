const util = require('../../utils/util.js');

Page({
  data: {
    recordId: '',
    record: null,
    reporter: '',
    date: '',
    description: '',
    photos: [],
    assignee: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recordId: options.id });
    }
  },

  onShow() {
    // onShow a little more robust to reload data when back from editing
    if (this.data.recordId) {
      this.fetchDetail(this.data.recordId);
    }
  },

  async fetchDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUnsafeRecords',
        data: { id: id }
      });
      wx.hideLoading();
      if (res.result && res.result.success && res.result.data) {
        this.setRecordData(res.result.data);
      } else {
        wx.showToast({ title: '记录不存在', icon: 'error' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
      console.error("fetch detail failed", e);
    }
  },

  setRecordData(record) {
    this.setData({
      record: record,
      reporter: record.reporter,
      date: util.formatDate(new Date(record.date)),
      description: record.description,
      photos: record.photos || [],
      assignee: record.assignee
    });
  },

  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: this.data.photos,
      current: this.data.photos[index]
    });
  },

  onExit() {
    wx.navigateBack();
  },

  onEdit() {
    wx.navigateTo({
      url: `/pages/unsafe-management/unsafe-report?id=${this.data.recordId}&mode=edit`
    });
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？此操作不可逆。',
      confirmColor: '#e53935',
      success: res => {
        if (res.confirm) {
          this.deleteRecord();
        }
      }
    });
  },

  async deleteRecord() {
    wx.showLoading({ title: '删除中...' });
    try {
      await wx.cloud.callFunction({
        name: 'deleteUnsafeRecord',
        data: { id: this.data.recordId }
      });
      wx.hideLoading();
      wx.showToast({ title: '删除成功' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
      console.error("delete record failed", error);
    }
  }
});
