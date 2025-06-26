Page({
  data: {
    records: [],
    // 筛选条件
    projectOptions: ['ALL', 'UTILITY', 'BMM', 'G68', 'P71A', 'P171', 'E371'],
    projectIndex: 0,
    deviceMap: {
      'ALL': ['全部设备'],
      'UTILITY': ['全部设备', '配电室', '空压机', '冷水机组', '空调'],
      'BMM': ['全部设备', 'Feeding system', 'Grinder', 'BM', 'PC', 'Cooling tower'],
      'G68': ['全部设备', 'FC', 'ASSEMBLY', 'HLT'],
      'P71A': ['全部设备', 'FC', 'ASSEMBLY', 'HLT'],
      'P171': ['全部设备', 'FC', 'ASSEMBLY', 'HLT'],
      'E371': ['全部设备', 'FC', 'ASSEMBLY', 'HLT']
    },
    deviceOptions: ['全部设备'],
    deviceIndex: 0,
    startDate: '',
    endDate: ''
  },

  onLoad() {
    this.fetchRecords();
  },
  
  onProjectChange(e) {
    const projectIndex = e.detail.value;
    const selectedProject = this.data.projectOptions[projectIndex];
    const deviceOptions = this.data.deviceMap[selectedProject] || ['全部设备'];
    this.setData({
      projectIndex,
      deviceOptions,
      deviceIndex: 0 // 重置设备选项
    });
  },
  
  onDeviceChange(e) {
    this.setData({
      deviceIndex: e.detail.value
    });
  },
  
  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  onFilter() {
    const selectedProject = this.data.projectOptions[this.data.projectIndex];
    const selectedDevice = this.data.deviceOptions[this.data.deviceIndex];

    const filter = {
      project: selectedProject === 'ALL' ? null : selectedProject,
      device: selectedDevice === '全部设备' ? null : selectedDevice,
      startDate: this.data.startDate,
      endDate: this.data.endDate,
    };
    
    // 清理无效的filter项
    Object.keys(filter).forEach(key => {
      if (!filter[key]) delete filter[key];
    });

    this.fetchRecords(filter);
  },

  onReset() {
    this.setData({
      projectIndex: 0,
      deviceOptions: this.data.deviceMap['ALL'],
      deviceIndex: 0,
      startDate: '',
      endDate: ''
    });
    this.fetchRecords();
  },

  fetchRecords(filter = null) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getTpmRecords',
      data: { filter },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          this.setData({ records: res.result.data });
        } else {
          this.setData({ records: [] });
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ records: [] });
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },
  
  onAddNew() {
    wx.navigateTo({ url: '/pages/tpm-management/tpm-record' });
  },

  onBack() {
    wx.navigateBack();
  },

  onViewRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/tpm-management/tpm-record?id=${id}&mode=view` });
  },

  onEditRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/tpm-management/tpm-record?id=${id}&mode=edit` });
  },

  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: res => {
        if (res.confirm) {
          this.deleteCloudRecord(id);
        }
      }
    });
  },

  deleteCloudRecord(id) {
    wx.showLoading({ title: '删除中...' });
    wx.cloud.callFunction({
      name: 'deleteTpmRecord',
      data: { id },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          wx.showToast({ title: '删除成功' });
          this.fetchRecords(); // 刷新列表
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '删除请求失败', icon: 'none' });
      }
    });
  },

  onPreviewPhoto(e) {
    const { photos, url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: photos
    });
  }
});
