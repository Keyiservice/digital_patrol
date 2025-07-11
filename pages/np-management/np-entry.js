const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    projectOptions: ['D2XX', 'G68', 'P71A', 'P171', 'E371'],  // 默认项目选项
    projectIndex: 0,  // 选中的项目索引
    currentDate: '',  // 当前日期
    currentTime: '',  // 当前时间
    tNumber: '',  // T-NUMBER
    reasonOptions: ['磕碰伤', '外观不良', '未进入cookie', '飞边不合格', '重量不合格', '焊接报警', 'CCD报警', '焊接不良', '氦检侧漏失败'],  // 默认不合格原因选项
    reasonIndex: 0,  // 选中的不合格原因索引
    defectLocationPhoto: '',  // 不合格位置照片
    treatmentOptions: [
      { label: 'Rework', value: 'rework' },
      { label: 'Scrap', value: 'scrap' },
      { label: 'On-Hold', value: 'on_hold' },
      { label: 'Use as it', value: 'use_as_it' }
    ],
    treatment: 'rework',  // 处理方法
    isEditMode: false,
    recordId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('页面加载');
    // 初始化当前日期和时间
    const now = new Date();
    const formatDate = util.formatDate(now);
    const formatTime = util.formatTime(now).substring(11, 16); // 只取时:分部分
    
    this.setData({
      currentDate: formatDate,
      currentTime: formatTime
    });

    // 只要有id参数就加载详情
    if (options.id) {
      this.setData({
        isEditMode: options.mode === 'edit',
        recordId: options.id
      });
      this.fetchRecordDetail(options.id);
    }
  },

  /**
   * 获取记录详情
   */
  fetchRecordDetail: function(id) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 尝试从云函数获取数据
    try {
      wx.cloud.callFunction({
        name: 'getNpRecords',
        data: { id: id },
        success: res => {
          wx.hideLoading();
          
          if (res && res.result && res.result.data) {
            const record = res.result.data;
            
            // 找到项目索引
            const projectIndex = this.data.projectOptions.findIndex(item => item === record.project);
            
            // 找到原因索引
            const reasonIndex = this.data.reasonOptions.findIndex(item => item === record.reason);
            
            // 设置表单数据
            this.setData({
              projectIndex: projectIndex >= 0 ? projectIndex : 0,
              currentDate: record.date,
              currentTime: record.time,
              tNumber: record['t-number'] || '',
              reasonIndex: reasonIndex >= 0 ? reasonIndex : 0,
              defectLocationPhoto: record.defectLocationPhoto || '',
              treatment: this.getTreatmentValue(record.treatment)
            });
          } else {
            // 云端无数据，尝试本地
            this.getRecordFromStorage(id);
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('获取记录详情失败：', err);
          
          // 从本地存储获取
          this.getRecordFromStorage(id);
          
          wx.showToast({
            title: '获取记录失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (e) {
      wx.hideLoading();
      console.error('云函数调用出错：', e);
      
      // 从本地存储获取
      this.getRecordFromStorage(id);
      
      wx.showToast({
        title: '云服务调用失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 从本地存储获取记录
   */
  getRecordFromStorage: function(id) {
    const storageRecords = wx.getStorageSync('npRecords') || [];
    // 兼容id和_id
    const record = storageRecords.find(item => item.id === id || item._id === id);
    
    if (record) {
      // 找到项目索引
      const projectIndex = this.data.projectOptions.findIndex(item => item === record.project);
      
      // 找到原因索引
      const reasonIndex = this.data.reasonOptions.findIndex(item => item === record.reason);
      
      // 设置表单数据
      this.setData({
        projectIndex: projectIndex >= 0 ? projectIndex : 0,
        currentDate: record.date,
        currentTime: record.time,
        tNumber: record['t-number'] || '',
        reasonIndex: reasonIndex >= 0 ? reasonIndex : 0,
        defectLocationPhoto: record.defectLocationPhoto || '',
        treatment: this.getTreatmentValue(record.treatment)
      });
    }
  },

  // 项目选择变更处理函数
  onProjectChange: function (e) {
    console.log('项目选择变更:', e);
    const index = e.detail.value;
    this.setData({
      projectIndex: index
    });
    console.log('当前选中项目索引:', index, '项目名称:', this.data.projectOptions[index]);
  },

  // 日期变更处理函数
  onDateChange: function (e) {
    console.log('日期变更:', e);
    this.setData({
      currentDate: e.detail.value
    });
  },

  // 时间变更处理函数
  onTimeChange: function (e) {
    console.log('时间变更:', e);
    this.setData({
      currentTime: e.detail.value
    });
  },

  // T-NUMBER输入处理函数
  onTNumberInput: function (e) {
    this.setData({
      tNumber: e.detail.value
    });
  },

  // 扫描T-NUMBER
  onScanTNumber: function () {
    wx.scanCode({
      scanType: ['barCode'],
      success: (res) => {
        this.setData({
          tNumber: res.result
        });
      },
      fail: () => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },

  // 不合格原因选择变更处理函数
  onReasonChange: function (e) {
    console.log('不合格原因变更:', e);
    const index = e.detail.value;
    this.setData({
      reasonIndex: index
    });
    console.log('当前选中原因索引:', index, '原因:', this.data.reasonOptions[index]);
  },

  /**
   * 拍照功能 - 简化版，直接使用本地图片路径
   */
  takePhoto: function(e) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 压缩图片，减少存储空间
      sourceType: ['camera', 'album'],
      success: (res) => {
        // 直接使用本地临时路径，不进行云存储上传
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          defectLocationPhoto: tempFilePath
        });
          },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 预览图片
   */
  previewImage: function(e) {
    const photo = e.currentTarget.dataset.photo;
    if (photo) {
      wx.previewImage({ urls: [photo] });
    }
  },

  // 处理方法选择变更
  onTreatmentChange: function (e) {
    console.log('处理方法变更:', e);
    this.setData({
      treatment: e.detail.value
    });
  },

  validateAndGetData: function() {
    const { projectOptions, projectIndex, currentDate, currentTime, reasonOptions, reasonIndex, defectLocationPhoto, treatment, tNumber } = this.data;
    
    // 验证必填项
    if (!projectOptions[projectIndex]) {
      wx.showToast({ title: '请选择项目', icon: 'none' });
      return null;
    }
    
    if (!tNumber.trim()) {
      wx.showToast({ title: '请输入T-NUMBER', icon: 'none' });
      return null;
    }
    
    if (!reasonOptions[reasonIndex]) {
      wx.showToast({ title: '请选择不合格原因', icon: 'none' });
      return null;
    }
    
    if (!defectLocationPhoto) {
      wx.showToast({ title: '请拍摄不合格位置照片', icon: 'none' });
      return null;
    }
    
    if (!treatment) {
      wx.showToast({ title: '请选择处理方法', icon: 'none' });
      return null;
    }
    
    // 构建记录数据
    const record = {
      project: projectOptions[projectIndex],
      date: currentDate,
      time: currentTime,
      't-number': tNumber,
      reason: reasonOptions[reasonIndex],
      defectLocationPhoto: defectLocationPhoto,
      treatment: treatment
    };
    
    return record;
  },

  onSave: function() {
    const recordData = this.validateAndGetData();
    if (!recordData) return;
    
    wx.showLoading({ title: '保存中...' });
    
    // 如果是本地文件路径，先上传到云存储
    if (this.data.defectLocationPhoto && !this.data.defectLocationPhoto.startsWith('cloud://')) {
      this.uploadDefectPhoto(this.data.defectLocationPhoto)
        .then(fileID => {
          recordData.defectLocationPhoto = fileID;
          this.saveToCloud(recordData);
        })
        .catch(err => {
          wx.hideLoading();
          console.error('照片上传失败:', err);
          wx.showToast({
            title: '照片上传失败，请重试',
            icon: 'none'
          });
        });
    } else {
      // 如果已经是云存储路径或没有照片，直接保存
      this.saveToCloud(recordData);
    }
  },
  
  // 上传不合格位置照片到云存储
  uploadDefectPhoto: function(filePath) {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().getTime();
      const cloudPath = `np-photos/defect_${timestamp}.jpg`;
      
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: res => {
          resolve(res.fileID);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  },
  
  // 保存记录到云数据库
  saveToCloud: function(recordData) {
    wx.cloud.callFunction({
      name: 'saveNpRecord',
      data: {
        id: this.data.recordId,
        record: recordData
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: (res.result && res.result.message) || '保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('保存记录失败:', err);
        wx.showToast({ title: '调用服务失败', icon: 'none' });
      }
    });
  },

  // 退出页面
  onExit: function () {
    wx.navigateBack();
  },

  getTreatmentValue: function(label) {
    const option = this.data.treatmentOptions.find(item => item.label === label);
    return option ? option.value : 'rework';
  }
}); 