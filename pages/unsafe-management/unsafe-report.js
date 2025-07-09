const util = require('../../utils/util.js');

Page({
  data: {
    // 表单数据
    reporter: '',
    date: '',
    description: '',
    photos: [],
    assignee: '',

    // 页面状态
    isSaving: false,
    mode: 'add',
    recordId: '',
    isViewMode: false,
    isEditMode: false,
  },

  onLoad(options) {
    const mode = options?.mode || 'add';
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    this.setData({
      mode: mode,
      isViewMode: isViewMode,
      isEditMode: isEditMode,
      recordId: options?.id || ''
    });

    if (options && options.id) {
      this.fetchDetail(options.id);
    } else {
      // 新建模式初始化
      this.setData({
        date: util.formatDate(new Date()),
        reporter: wx.getStorageSync('userInfo')?.accountName || '',
      });
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
      console.error("fetch detail failed", e)
    }
  },

  setRecordData(record) {
    this.setData({
      reporter: record.reporter,
      date: util.formatDate(new Date(record.date)),
      description: record.description,
      photos: record.photos || [],
      assignee: record.assignee
    });
  },

  // --- 表单输入处理 ---
  onReporterChange(e) { this.setData({ reporter: e.detail.value }); },
  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onDescriptionChange(e) { this.setData({ description: e.detail.value }); },
  onAssigneeChange(e) { this.setData({ assignee: e.detail.value }); },

  // --- 照片处理 ---
  onAddPhoto() {
    wx.chooseMedia({
      count: 9 - this.data.photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          photos: this.data.photos.concat(tempFiles).slice(0, 9)
        });
      }
    });
  },

  onDeletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = [...this.data.photos];
    photos.splice(index, 1);
    this.setData({ photos });
  },

  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: this.data.photos,
      current: this.data.photos[index]
    });
  },

  // --- 页面操作 ---
  onExit() {
    wx.navigateBack();
  },

  async onSave() {
    if (!this.data.description) {
      wx.showToast({ title: '请填写描述', icon: 'none' });
      return;
    }
    if (this.data.isSaving) return;
    this.setData({ isSaving: true });
    wx.showLoading({ title: '保存中...' });

    try {
      const uploadedPhotos = await this.uploadPhotos(this.data.photos);
      const recordData = {
        reporter: this.data.reporter,
        date: this.data.date,
        description: this.data.description,
        assignee: this.data.assignee,
        photos: uploadedPhotos,
        status: 'open' // or other default status
      };

      if (this.data.isEditMode) {
        recordData.id = this.data.recordId;
      }

      await wx.cloud.callFunction({
        name: 'saveUnsafeRecord',
        data: recordData
      });
      
      wx.hideLoading();
      wx.showToast({ title: '保存成功' });
      setTimeout(() => wx.navigateBack(), 1500);

    } catch (error) {
      wx.hideLoading();
      this.setData({ isSaving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.error("failed to save", error)
    }
  },

  uploadFile(filePath) {
    const cloudPath = `unsafe-photos/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}` + filePath.match(/\.[^.]+?$/)[0];
    return wx.cloud.uploadFile({
      cloudPath,
      filePath,
    });
  },

  async uploadPhotos(photos) {
    const uploadTasks = photos.map(photo => {
      if (photo.startsWith('cloud://')) {
        return Promise.resolve({ fileID: photo });
      }
      return this.uploadFile(photo);
    });
    const results = await Promise.all(uploadTasks);
    return results.map(res => res.fileID);
  }
});




