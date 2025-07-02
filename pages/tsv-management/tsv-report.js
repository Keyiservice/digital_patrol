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
      
      console.log('从任务列表接收到的数据:', taskInfo);
      
      // 设置基本表单数据
      this.setData({
        taskId: taskInfo._id,
        'formData.date': util.formatDate(now),
        'formData.time': util.formatTime(now).substring(11, 16),
        'formData.interviewerName': taskInfo.interviewerName || '',
        'formData.interviewerDept': taskInfo.interviewerDept || '未知部门',
        'formData.interviewerJob': taskInfo.interviewerJob || '未知职位',
        'formData.intervieweeName': taskInfo.intervieweeName || '',
        'formData.intervieweeDept': taskInfo.intervieweeDept || '未知部门',
        'formData.intervieweeJob': taskInfo.intervieweeJob || '未知职位',
      });
      
      // 如果部门信息为空或未知，尝试从用户信息中获取
      if (!taskInfo.interviewerDept || taskInfo.interviewerDept === '未知部门') {
        this.loadInterviewerInfo();
      }
      
      // 如果被访谈人部门信息为空或未知，尝试从数据库获取
      if (!taskInfo.intervieweeDept || taskInfo.intervieweeDept === '未知部门') {
        // 尝试使用accountName或name作为账号名
        const intervieweeAccountName = taskInfo.intervieweeAccountName || taskInfo.intervieweeName;
        this.loadIntervieweeInfo(intervieweeAccountName);
      }
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
  },
  
  // 加载访谈人信息
  loadInterviewerInfo() {
    // 从本地存储获取当前用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      console.warn('无法获取本地用户信息，将使用默认部门信息');
      return;
    }
    
    const accountName = userInfo.accountName || userInfo.name;
    if (!accountName) {
      console.warn('用户账号名为空，将使用默认部门信息');
      return;
    }
    
    console.log('尝试获取访谈人信息，账号名:', accountName);
    
    // 调用云函数获取用户详细信息
    wx.cloud.callFunction({
      name: 'getPlantUsers',
      data: {
        accountName: accountName
      },
      success: res => {
        console.log('获取访谈人信息结果:', res);
        if (res.result && res.result.success && res.result.data && res.result.data.length > 0) {
          const userData = res.result.data[0];
          console.log('访谈人原始数据:', userData);
          
          // 尝试多种可能的字段名获取部门
          const department = userData.department || userData['部门'] || this.data.formData.interviewerDept;
          const position = userData.position || userData['职位'] || this.data.formData.interviewerJob;
          
          this.setData({
            'formData.interviewerDept': department,
            'formData.interviewerJob': position
          });
          console.log('已更新访谈人信息 - 部门:', department, '职位:', position);
        } else {
          console.warn('未找到访谈人信息，使用默认值');
          // 确保即使没找到也设置默认值
          this.setData({
            'formData.interviewerDept': this.data.formData.interviewerDept || '未知部门',
            'formData.interviewerJob': this.data.formData.interviewerJob || '未知职位'
          });
        }
      },
      fail: err => {
        console.error('调用获取用户信息云函数失败:', err);
        // 失败时也设置默认值
        this.setData({
          'formData.interviewerDept': this.data.formData.interviewerDept || '未知部门',
          'formData.interviewerJob': this.data.formData.interviewerJob || '未知职位'
        });
      }
    });
  },
  
  // 加载被访谈人信息
  loadIntervieweeInfo(accountName) {
    if (!accountName) {
      console.warn('被访谈人账号名为空，将使用默认部门信息');
      // 如果没有账号名，直接使用默认值
      this.setData({
        'formData.intervieweeDept': '未知部门',
        'formData.intervieweeJob': '未知职位'
      });
      return;
    }
    
    console.log('尝试获取被访谈人信息，账号名:', accountName);
    
    // 调用云函数获取被访谈人详细信息
    wx.cloud.callFunction({
      name: 'getPlantUsers',
      data: {
        accountName: accountName
      },
      success: res => {
        console.log('获取被访谈人信息结果:', res);
        if (res.result && res.result.success && res.result.data && res.result.data.length > 0) {
          const userData = res.result.data[0];
          console.log('被访谈人原始数据:', userData);
          
          // 尝试多种可能的字段名获取部门
          const department = userData.department || userData['部门'] || this.data.formData.intervieweeDept;
          const position = userData.position || userData['职位'] || this.data.formData.intervieweeJob;
          
          this.setData({
            'formData.intervieweeDept': department,
            'formData.intervieweeJob': position
          });
          console.log('已更新被访谈人信息 - 部门:', department, '职位:', position);
        } else {
          console.warn('未找到被访谈人信息，使用默认值');
          // 确保即使没找到也设置默认值
          this.setData({
            'formData.intervieweeDept': this.data.formData.intervieweeDept || '未知部门',
            'formData.intervieweeJob': this.data.formData.intervieweeJob || '未知职位'
          });
        }
      },
      fail: err => {
        console.error('调用获取被访谈人信息云函数失败:', err);
        // 失败时也设置默认值
        this.setData({
          'formData.intervieweeDept': this.data.formData.intervieweeDept || '未知部门',
          'formData.intervieweeJob': this.data.formData.intervieweeJob || '未知职位'
        });
      }
    });
  }
});
