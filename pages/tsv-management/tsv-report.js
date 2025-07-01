const util = require('../../utils/util.js');

Page({
  data: {
    taskId: '', // 从上一个页面传来
    formData: {
      date: '',
      time: '',
      location: '',
      intervieweeTask: '',
      interviewerName: '',
      interviewerDept: '',
      interviewerJob: '',
      intervieweeName: '',
      intervieweeDept: '',
      intervieweeJob: '',
      goodBehavior: '',
      unsafeBehavior: '',
      unsafeCondition: '',
      similarAccidents: '',
      bigRisk: 'no', // 默认'no'
    },
    photos: [], // 存储本地临时路径
    isSubmitting: false,
  },

  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromOpenerPage', (res) => {
      const taskInfo = res.data;
      const now = new Date();
      this.setData({
        taskId: taskInfo._id,
        'formData.date': util.formatDate(now),
        'formData.time': util.formatTime(now).substring(11, 16),
        'formData.interviewerName': taskInfo.interviewerName,
        'formData.interviewerDept': taskInfo.interviewerDept,
        'formData.interviewerJob': taskInfo.interviewerJob,
        'formData.intervieweeName': taskInfo.intervieweeName,
        'formData.intervieweeDept': taskInfo.intervieweeDept,
        'formData.intervieweeJob': taskInfo.intervieweeJob,
      });
    });
  },
  
  // --- 表单事件处理 ---
  bindDateChange(e) { this.setData({ 'formData.date': e.detail.value }); },
  bindTimeChange(e) { this.setData({ 'formData.time': e.detail.value }); },
  handleRadioChange(e) { this.setData({ [`formData.${e.currentTarget.dataset.field}`]: e.detail.value }); },
  handleInputChange(e) { this.setData({ [`formData.${e.currentTarget.dataset.field}`]: e.detail.value }); },

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

  // --- 提交 ---
  async onSubmit() {
    if (this.data.isSubmitting) return;

    // 表单校验
    const requiredFields = ['date', 'time', 'location', 'intervieweeTask'];
    for (let field of requiredFields) {
      if (!this.data.formData[field]) {
        wx.showToast({ title: `请填写第 ${this.getQuestionNumber(field)} 项`, icon: 'none' });
        return;
      }
    }
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在提交...' });
    
    try {
      // 1. 上传图片
      const uploadedPhotos = await this.uploadPhotos(this.data.photos);
      
      // 2. 准备提交的数据
      const submissionData = {
        ...this.data.formData,
        photos: uploadedPhotos,
        status: 'completed',
        completedAt: new Date(),
      };
      
      // 3. 调用云函数
      await wx.cloud.callFunction({
        name: 'saveTsvReport',
        data: {
          taskId: this.data.taskId,
          reportData: submissionData,
        }
      });
      
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);

    } catch (err) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      console.error('提交TSV失败', err);
    }
  },

  getQuestionNumber(field) {
    const map = { date: '1', time: '2', location: '3', intervieweeTask: '4' };
    return map[field] || '';
  },

  // 照片上传逻辑
  uploadFile(filePath) {
    const cloudPath = `tsv-photos/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}` + filePath.match(/\.[^.]+?$/)[0];
    return wx.cloud.uploadFile({
      cloudPath,
      filePath,
    });
  },

  async uploadPhotos(photos) {
    if (!photos || photos.length === 0) {
      return [];
    }
    const uploadTasks = photos.map(photo => {
      // 假设已上传的图片不会在这里处理，只处理本地临时文件
      if (photo.startsWith('cloud://')) {
        return Promise.resolve({ fileID: photo });
      }
      return this.uploadFile(photo);
    });
    const results = await Promise.all(uploadTasks);
    return results.map(res => res.fileID);
  }
});
