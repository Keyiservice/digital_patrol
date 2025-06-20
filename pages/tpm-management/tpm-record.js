const util = require('../../utils/util.js');

Page({
  data: {
    // 一级项目/设备从属
    projectOptions: ['UTILITY', 'BMM', 'G68', 'P71A', 'P171', 'E371'],
    projectIndex: 0,
    // 二级设备名称
    deviceMap: {
      'UTILITY': ['配电室', '空压机', '冷水机组', '空调'],
      'BMM': ['Feeding system', 'Grinder', 'BM', 'PC', 'Cooling tower'],
      'G68': ['FC', 'ASSEMBLY', 'HLT'],
      'P71A': ['FC', 'ASSEMBLY', 'HLT'],
      'P171': ['FC', 'ASSEMBLY', 'HLT'],
      'E371': ['FC', 'ASSEMBLY', 'HLT']
    },
    deviceOptions: ['配电室', '空压机', '冷水机组', '空调'],
    deviceIndex: 0,
    // 日期时间
    currentDate: '',
    currentTime: '',
    // 保养人
    maintainer: '',
    // 照片
    photos: [],
    // 是否正在保存
    isSaving: false,
    isViewMode: false
  },

  onLoad(options) {
    // 初始化日期、时间、保养人
    const now = new Date();
    this.setData({
      currentDate: util.formatDate(now),
      currentTime: util.formatTime(now).substring(11, 16),
      maintainer: wx.getStorageSync('userInfo')?.accountName || '',
      isViewMode: options && options.mode === 'view',
    });
    // 若有id参数，加载详情
    if (options && options.id) {
      this.fetchDetail(options.id);
    }
  },

  async fetchDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.callFunction({ name: 'getTpmRecords', data: { id } });
      wx.hideLoading();
      if (res && res.result && res.result.data) {
        const record = Array.isArray(res.result.data) ? res.result.data.find(r => r._id === id) : res.result.data;
        if (record) {
          const projectIndex = this.data.projectOptions.findIndex(p => p === record.project);
          const deviceOptions = this.data.deviceMap[record.project] || [];
          const deviceIndex = deviceOptions.findIndex(d => d === record.device);
          this.setData({
            projectIndex: projectIndex >= 0 ? projectIndex : 0,
            deviceOptions,
            deviceIndex: deviceIndex >= 0 ? deviceIndex : 0,
            currentDate: record.date,
            currentTime: record.time,
            maintainer: record.maintainer,
            photos: record.photos || []
          });
        }
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onProjectChange(e) {
    const projectIndex = e.detail.value;
    const project = this.data.projectOptions[projectIndex];
    this.setData({
      projectIndex,
      deviceOptions: this.data.deviceMap[project],
      deviceIndex: 0
    });
  },

  onDeviceChange(e) {
    this.setData({
      deviceIndex: e.detail.value
    });
  },

  onDateChange(e) {
    this.setData({
      currentDate: e.detail.value
    });
  },

  onTimeChange(e) {
    this.setData({
      currentTime: e.detail.value
    });
  },

  // 多图上传
  onAddPhoto() {
    const that = this;
    wx.chooseMedia({
      count: 50 - that.data.photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath);
        that.setData({
          photos: that.data.photos.concat(newPhotos).slice(0, 50)
        });
      }
    });
  },
  onPreviewPhoto(e) {
    const idx = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: this.data.photos,
      current: this.data.photos[idx]
    });
  },

  // 退出
  onExit() {
    wx.showModal({
      title: '确认退出',
      content: '未保存的数据将丢失，确定要退出吗？',
      success: res => {
        if (res.confirm) {
          wx.navigateBack({ delta: 1 });
        }
      }
    });
  },

  // 保存
  async onSave() {
    if (this.data.isSaving) return;
    // 简单校验
    if (!this.data.maintainer) {
      wx.showToast({ title: '未获取到保养人', icon: 'none' });
      return;
    }
    if (!this.data.photos.length) {
      wx.showToast({ title: '请上传至少一张照片', icon: 'none' });
      return;
    }
    this.setData({ isSaving: true });
    wx.showLoading({ title: '保存中...' });
    try {
      // 上传所有图片到云存储
      const uploadTasks = this.data.photos.map((filePath, idx) => {
        return wx.cloud.uploadFile({
          cloudPath: `tpm_evidence/${Date.now()}_${idx}.jpg`,
          filePath
        }).then(res => res.fileID);
      });
      const fileIDs = await Promise.all(uploadTasks);
      // 调用云函数保存记录
      await wx.cloud.callFunction({
        name: 'saveTpmRecord',
        data: {
          project: this.data.projectOptions[this.data.projectIndex],
          device: this.data.deviceOptions[this.data.deviceIndex],
          date: this.data.currentDate,
          time: this.data.currentTime,
          maintainer: this.data.maintainer,
          photos: fileIDs,
          createTime: new Date().toISOString()
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    this.setData({ isSaving: false });
  }
});
