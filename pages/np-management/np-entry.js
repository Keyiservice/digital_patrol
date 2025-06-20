const util = require('../../utils/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 项目选择
    projectOptions: ['G68', 'P71A', 'P171', 'E371'],
    projectIndex: 0,
    
    // 日期时间
    currentDate: '',
    currentTime: '',
    
    // 不合格原因
    reasonOptions: ['Shape Defect', 'Size Issue', 'Surface Defect', 'Color Issue', 'Material Problem', 'Assembly Error', 'Other'],
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
              reasonIndex: reasonIndex >= 0 ? reasonIndex : 0,
              barcodePhoto: record.barcodePhotoUrl || record.barcodePhoto || '',
              defectLocationPhoto: record.defectLocationPhotoUrl || record.defectLocationPhoto || '',
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
        reasonIndex: reasonIndex >= 0 ? reasonIndex : 0,
        barcodePhoto: record.barcodePhoto || record.barcodePhotoUrl || '',
        defectLocationPhoto: record.defectLocationPhoto || record.defectLocationPhotoUrl || '',
        treatment: this.getTreatmentValue(record.treatment)
      });
    }
  },

  /**
   * 项目选择变更
   */
  onProjectChange: function(e) {
    this.setData({
      projectIndex: e.detail.value
    });
  },

  /**
   * 日期选择变更
   */
  onDateChange: function(e) {
    this.setData({
      currentDate: e.detail.value
    });
  },

  /**
   * 时间选择变更
   */
  onTimeChange: function(e) {
    this.setData({
      currentTime: e.detail.value
    });
  },

  /**
   * 不合格原因选择变更
   */
  onReasonChange: function(e) {
    this.setData({
      reasonIndex: e.detail.value
    });
  },

  /**
   * 处理方法选择变更
   */
  onTreatmentChange: function(e) {
    this.setData({
      treatment: e.detail.value
    });
  },

  /**
   * 拍照功能
   */
  takePhoto: function(e) {
    const that = this;
    const photoType = e.currentTarget.dataset.type;
    wx.chooseMedia({
      count: 1, // 最多选择1张
      mediaType: ['image'], // 只支持图片
      sourceType: ['camera', 'album'], // 相机和相册
      camera: 'back',
      success(res) {
        const tempFile = res.tempFiles[0];
        // 限制文件大小（500KB）
        if (tempFile.size > 500 * 1024) {
          wx.showToast({
            title: '图片过大，正在压缩...',
            icon: 'none',
            duration: 1500
          });
          // 压缩图片
          wx.compressImage({
            src: tempFile.tempFilePath,
            quality: 60, // 质量压缩到60%
            success: function (compressRes) {
              that.setPhoto(photoType, compressRes.tempFilePath);
            },
            fail: function () {
              wx.showToast({
                title: '图片压缩失败',
                icon: 'none',
                duration: 2000
              });
            }
          });
        } else {
          // 检查图片尺寸
          wx.getImageInfo({
            src: tempFile.tempFilePath,
            success: function(info) {
              if (info.width > 800 || info.height > 800) {
                wx.showToast({
                  title: '图片分辨率过高，正在压缩...',
                  icon: 'none',
                  duration: 1500
                });
                wx.compressImage({
                  src: tempFile.tempFilePath,
                  quality: 60,
                  success: function (compressRes) {
                    that.setPhoto(photoType, compressRes.tempFilePath);
                  },
                  fail: function () {
                    wx.showToast({
                      title: '图片压缩失败',
                      icon: 'none',
                      duration: 2000
                    });
                  }
                });
              } else {
                that.setPhoto(photoType, tempFile.tempFilePath);
              }
            },
            fail: function() {
              that.setPhoto(photoType, tempFile.tempFilePath);
            }
          });
        }
      }
    });
  },

  setPhoto: function(photoType, filePath) {
    if (photoType === 'barcode') {
      this.setData({ barcodePhoto: filePath });
    } else if (photoType === 'defectLocation') {
      this.setData({ defectLocationPhoto: filePath });
    }
  },

  /**
   * 预览图片
   */
  previewImage: function(e) {
    const photo = e.currentTarget.dataset.photo;
    if (photo) {
      wx.previewImage({
        urls: [photo],
        current: photo
      });
    }
  },

  /**
   * 保存数据
   */
  onSave: function() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }

    // 准备表单数据
    const formData = {
      project: this.data.projectOptions[this.data.projectIndex],
      date: this.data.currentDate,
      time: this.data.currentTime,
      reason: this.data.reasonOptions[this.data.reasonIndex],
      treatment: this.getTreatmentLabel(this.data.treatment),
      createTime: new Date().getTime()
    };

    // 如果是编辑模式，添加记录ID
    if (this.data.isEditMode) {
      formData.id = this.data.recordId;
    }

    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    // 尝试上传照片并保存数据
    try {
      this.uploadPhotos()
        .then(photoUrls => {
          // 将照片URL添加到表单数据
          formData.barcodePhotoUrl = photoUrls.barcodeUrl || '';
          formData.defectLocationPhotoUrl = photoUrls.defectLocationUrl || '';
          
          // 尝试调用云函数保存数据到数据库
          this.saveToCloud(formData);
        })
        .catch(err => {
          wx.hideLoading();
          console.error('上传照片失败：', err);
          
          // 如果云上传失败，保存到本地
          this.saveToLocal(formData);
          
          wx.showToast({
            title: '已保存到本地',
            icon: 'success',
            duration: 2000
          });
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 2000);
        });
    } catch (e) {
      wx.hideLoading();
      console.error('保存过程出错：', e);
      
      // 保存到本地
      this.saveToLocal(formData);
      
      wx.showToast({
        title: '已保存到本地',
        icon: 'success',
        duration: 2000
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 2000);
    }
  },

  /**
   * 保存到云数据库
   */
  saveToCloud: function(formData) {
    wx.cloud.callFunction({
      name: 'saveNpRecord',
      data: formData,
      success: res => {
        wx.hideLoading();
        
        if (res && res.result && res.result.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          });
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 2000);
        } else {
          console.error('[云函数] [saveNpRecord] 保存失败：', res);
          
          // 如果云保存失败，保存到本地
          this.saveToLocal(formData);
          
          wx.showToast({
            title: '已保存到本地',
            icon: 'success',
            duration: 2000
          });
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 2000);
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('[云函数] [saveNpRecord] 调用失败：', err);
        
        // 保存到本地
        this.saveToLocal(formData);
        
        wx.showToast({
          title: '已保存到本地',
          icon: 'success',
          duration: 2000
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 2000);
      }
    });
  },

  /**
   * 保存到本地存储
   */
  saveToLocal: function(formData) {
    // 添加本地照片路径
    formData.barcodePhoto = this.data.barcodePhoto;
    formData.defectLocationPhoto = this.data.defectLocationPhoto;
    
    // 生成唯一ID
    if (!formData.id) {
      formData.id = 'local_' + new Date().getTime();
    }
    
    // 获取本地存储的记录
    const storageRecords = wx.getStorageSync('npRecords') || [];
    
    // 检查是否是编辑模式
    if (this.data.isEditMode) {
      // 找到并更新现有记录
      const index = storageRecords.findIndex(item => item.id === formData.id);
      if (index >= 0) {
        storageRecords[index] = formData;
      } else {
        storageRecords.push(formData);
      }
    } else {
      // 添加新记录
      storageRecords.push(formData);
    }
    
    // 保存到本地存储
    wx.setStorageSync('npRecords', storageRecords);
  },

  /**
   * 上传照片
   */
  uploadPhotos: function() {
    return new Promise((resolve, reject) => {
      const photoUrls = {};
      const uploadTasks = [];
      
      // 检查是否有云环境
      if (!wx.cloud) {
        reject(new Error('微信云环境未初始化'));
        return;
      }
      
      // 上传条码照片
      if (this.data.barcodePhoto) {
        const barcodePromise = this.uploadPhoto(this.data.barcodePhoto, 'barcode')
          .then(fileID => {
            photoUrls.barcodeUrl = fileID;
          }).catch(err => {
            console.error('上传条码照片失败:', err);
            // 失败处理但不阻止流程
          });
        uploadTasks.push(barcodePromise);
      }
      
      // 上传不合格位置照片
      if (this.data.defectLocationPhoto) {
        const defectPromise = this.uploadPhoto(this.data.defectLocationPhoto, 'defectLocation')
          .then(fileID => {
            photoUrls.defectLocationUrl = fileID;
          }).catch(err => {
            console.error('上传不合格位置照片失败:', err);
            // 失败处理但不阻止流程
          });
        uploadTasks.push(defectPromise);
      }
      
      // 等待所有上传任务完成
      Promise.all(uploadTasks)
        .then(() => {
          resolve(photoUrls);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  /**
   * 上传单张照片
   */
  uploadPhoto: function(filePath, type) {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().getTime();
      const cloudPath = `np_management/${type}_${timestamp}.jpg`;
      
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

  /**
   * 获取处理方法标签
   */
  getTreatmentLabel: function(value) {
    const option = this.data.treatmentOptions.find(item => item.value === value);
    return option ? option.label : '';
  },

  /**
   * 获取处理方法值
   */
  getTreatmentValue: function(label) {
    const option = this.data.treatmentOptions.find(item => item.label === label);
    return option ? option.value : 'rework'; // 默认返回rework
  },

  /**
   * 表单验证
   */
  validateForm: function() {
    // 检查是否有项目选择
    if (this.data.projectIndex === undefined) {
      wx.showToast({
        title: '请选择项目',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 检查是否有不合格原因
    if (this.data.reasonIndex === undefined) {
      wx.showToast({
        title: '请选择不合格原因',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 检查是否有条码照片
    if (!this.data.barcodePhoto) {
      wx.showToast({
        title: '请拍摄条码照片',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 检查是否有不合格位置照片
    if (!this.data.defectLocationPhoto) {
      wx.showToast({
        title: '请拍摄不合格位置照片',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 检查是否有处理方法
    if (!this.data.treatment) {
      wx.showToast({
        title: '请选择处理方法',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    return true;
  },

  /**
   * 退出页面
   */
  onExit: function() {
    // 弹窗确认是否退出
    wx.showModal({
      title: '确认退出',
      content: '未保存的数据将丢失，确定要退出吗？',
      success: function(res) {
        if (res.confirm) {
          // 返回主页
          wx.navigateBack({
            delta: 1
          });
        }
      }
    });
  }
}); 