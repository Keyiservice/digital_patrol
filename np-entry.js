// pages/np-management/np-entry.js
const util = require('../../utils/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 项目选择 - 直接在页面定义默认值
    projectOptions: ['D2XX', 'G68', 'P71A', 'P171', 'E371'],
    projectIndex: 0,
    
    // 日期时间
    currentDate: '',
    currentTime: '',
    
    // 不合格原因 - 直接在页面定义默认值
    reasonOptions: ['磕碰伤', '外观不良', '未进入cookie', '飞边不合格', '重量不合格', '焊接报警', 'CCD报警', '焊接不良', '氦检侧漏失败'],
    reasonIndex: 0,
    
    // 照片
    barcodePhoto: '',
    defectLocationPhoto: '',
    
    // 处理方法
    treatmentOptions: [
      { label: 'Rework', value: 'rework' },
      { label: 'Scrap', value: 'scrap' },
      { label: 'On-Hold', value: 'on_hold' },
      { label: 'Use as it', value: 'use_as_it' }
    ],
    treatment: 'rework',
    tNumber: '', // T-NUMBER
    
    // 编辑模式
    isEditMode: false,
    recordId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
              barcodePhoto: record.barcodePhoto || '',
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
        barcodePhoto: record.barcodePhoto || '',
        defectLocationPhoto: record.defectLocationPhoto || '',
        treatment: this.getTreatmentValue(record.treatment)
      });
    }
  },

  onProjectChange: function(e) {
    const index = e.detail.value;
    this.setData({
      projectIndex: index
    });
  },

  onDateChange: function(e) {
    this.setData({
      currentDate: e.detail.value
    });
  },

  onTimeChange: function(e) {
    this.setData({
      currentTime: e.detail.value
    });
  },

  onTNumberInput: function(e) {
    this.setData({
      tNumber: e.detail.value
    });
  },

  onScanTNumber: function() {
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

  onReasonChange: function(e) {
    const index = e.detail.value;
    this.setData({
      reasonIndex: index
    });
  },

  /**
   * 拍照功能
   */
  takePhoto: function(e) {
    const photoType = e.currentTarget.dataset.type;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path;
        wx.showLoading({ title: '上传中...' });
        const cloudPath = `np-photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            wx.hideLoading();
            const fileID = uploadRes.fileID;
            if (photoType === 'barcode') {
              this.setData({ barcodePhoto: fileID });
            } else if (photoType === 'defectLocation') {
              this.setData({ defectLocationPhoto: fileID });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
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

  onTreatmentChange: function(e) {
    this.setData({
      treatment: e.detail.value
    });
  },

  validateAndGetData: function() {
    const { projectOptions, projectIndex, currentDate, currentTime, reasonOptions, reasonIndex, barcodePhoto, defectLocationPhoto, treatment, tNumber } = this.data;
    const record = {
      project: projectOptions[projectIndex],
      date: currentDate,
      time: currentTime,
      't-number': tNumber,
      reason: reasonOptions[reasonIndex],
      barcodePhoto: barcodePhoto,
      defectLocationPhoto: defectLocationPhoto,
      treatment: treatment
    };
    if (!record.project || !record.reason) {
      wx.showToast({ title: '请填写所有必填项', icon: 'none' });
      return null;
    }
    return record;
  },

  onSave: function() {
    const recordData = this.validateAndGetData();
    if (!recordData) return;
    wx.showLoading({ title: '保存中...' });
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
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '调用服务失败', icon: 'none' });
      }
    });
  },

  /**
   * 退出页面
   */
  onExit: function() {
    wx.navigateBack();
  },

  getTreatmentValue: function(label) {
    const option = this.data.treatmentOptions.find(item => item.label === label);
    return option ? option.value : 'rework';
  }
}); 