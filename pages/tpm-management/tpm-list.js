Page({
  data: {
    records: []
  },
  onLoad() {
    this.fetchRecords();
  },
  onShow() {
    this.fetchRecords();
  },
  fetchRecords() {
    wx.showLoading({ title: 'Loading...' });
    wx.cloud.callFunction({
      name: 'getTpmRecords',
      success: res => {
        wx.hideLoading();
        if (res && res.result && res.result.data) {
          // 按创建时间降序
          const sorted = res.result.data.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
          this.setData({ records: sorted });
        } else {
          this.setData({ records: [] });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '获取失败', icon: 'none' });
        this.setData({ records: [] });
      }
    });
  },
  onViewRecord(e) {
    // 只读模式，暂不支持编辑
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: `/pages/tpm-management/tpm-record?id=${id}&mode=view` });
    }
  },
  onPreviewPhoto(e) {
    const photos = e.currentTarget.dataset.photos || [];
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: photos,
      current: photos[index]
    });
  },
  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条TPM记录吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          wx.cloud.callFunction({
            name: 'deleteTpmRecord',
            data: { id },
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.fetchRecords();
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '删除失败', icon: 'none' });
            }
          });
        }
      }
    });
  },
  onAddNew() {
    wx.navigateTo({ url: '/pages/tpm-management/tpm-record' });
  },
  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});
