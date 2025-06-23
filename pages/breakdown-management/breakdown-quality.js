const util = require('../../utils/util.js');

Page({
  data: {
    // 记录ID
    recordId: '',
    // 故障记录详情
    recordDetail: {},
    // 检查内容
    inspectionContent: '',
    // 检查结果
    inspectionResult: '',
    // 首件条码
    firstPieceBarcode: '',
    // 照片
    photos: [],
    // 检验人员
    inspector: '',
    // 检查日期
    inspectionDate: '',
    // 检查时间
    inspectionTime: '',
    // 是否正在加载
    isLoading: true,
    // 是否正在保存
    isSaving: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({
        recordId: options.id
      });
      this.fetchRecordDetail(options.id);
    } else {
      wx.showToast({
        title: '缺少记录ID',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    }
    
    // 设置当前日期和时间
    const now = new Date();
    this.setData({
      inspectionDate: util.formatDate(now),
      inspectionTime: util.formatTime(now).substring(11, 16),
      inspector: wx.getStorageSync('userInfo')?.accountName || ''
    });
  },
  
  // 获取故障记录详情
  async fetchRecordDetail(id) {
    try {
      this.setData({ isLoading: true });
      
      if (id.startsWith('local_')) {
        this.getLocalRecord(id);
        return;
      }
      
      const res = await wx.cloud.callFunction({
        name: 'getBreakdownRecord',
        data: { id }
      });
      
      if (res && res.result && res.result.data) {
        // 处理云端返回数据
        const record = res.result.data;
        
        // 验证记录是否已完成维修
        if (record.status !== 'repaired') {
          wx.showToast({
            title: '此记录未完成维修',
            icon: 'none'
          });
        }
        
        this.setData({
          recordDetail: record,
          isLoading: false
        });
      } else {
        wx.showToast({
          title: '记录不存在',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      }
    } catch (err) {
      console.error('获取故障记录失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      this.getLocalRecord(id);
    }
  },
  
  // 获取本地记录
  getLocalRecord(id) {
    const localRecords = wx.getStorageSync('breakdownRecords') || [];
    const record = localRecords.find(r => r.id === id);
    
    if (record) {
      if (record.status !== 'repaired') {
        wx.showToast({
          title: '此记录未完成维修',
          icon: 'none'
        });
      }
      
      this.setData({
        recordDetail: record,
        isLoading: false
      });
    } else {
      wx.showToast({
        title: '本地记录不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    }
  },
  
  // 检查内容输入
  onInspectionContentInput(e) {
    this.setData({
      inspectionContent: e.detail.value
    });
  },
  
  // 检查结果输入
  onInspectionResultInput(e) {
    this.setData({
      inspectionResult: e.detail.value
    });
  },
  
  // 首件条码输入
  onFirstPieceBarcodeInput(e) {
    this.setData({
      firstPieceBarcode: e.detail.value
    });
  },
  
  // 添加照片
  onAddPhoto() {
    const that = this;
    wx.chooseMedia({
      count: 9 - that.data.photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'], // 优先使用压缩图片
      camera: 'back',
      success(res) {
        console.log('选择图片成功:', res.tempFiles);
        that.processSelectedImages(res.tempFiles);
      }
    });
  },
  
  // 处理选择的图片
  processSelectedImages(tempFiles) {
    const that = this;
    const processedPhotos = [];
    let remaining = tempFiles.length;
    
    // 最大允许的图片大小 (200KB)
    const MAX_SIZE = 200 * 1024;
    
    tempFiles.forEach((file, index) => {
      // 检查文件大小
      if (file.size > MAX_SIZE) {
        console.log(`图片 ${index+1} 超过200KB，进行压缩`);
        // 压缩图片
        wx.compressImage({
          src: file.tempFilePath,
          quality: 50, // 压缩质量(0-100)
          success: (compressRes) => {
            processedPhotos.push(compressRes.tempFilePath);
            checkCompletion();
          },
          fail: (err) => {
            console.error('压缩失败:', err);
            // 如果压缩失败，使用原图
            processedPhotos.push(file.tempFilePath);
            checkCompletion();
          }
        });
      } else {
        // 文件大小符合要求，直接使用
        processedPhotos.push(file.tempFilePath);
        checkCompletion();
      }
    });
    
    // 检查是否所有图片都处理完成
    function checkCompletion() {
      remaining--;
      if (remaining <= 0) {
        // 所有图片处理完成，更新数据
        that.setData({
          photos: that.data.photos.concat(processedPhotos).slice(0, 9)
        });
      }
    }
  },
  
  // 删除照片
  onDeletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined && index >= 0) {
      const photos = [...this.data.photos];
      photos.splice(index, 1);
      this.setData({ photos });
    }
  },
  
  // 预览照片
  onPreviewPhoto(e) {
    const idx = e.currentTarget.dataset.index;
    if (this.data.photos && this.data.photos.length > 0 && this.data.photos[idx]) {
      wx.previewImage({
        urls: this.data.photos,
        current: this.data.photos[idx]
      });
    }
  },
  
  // 处理图片加载错误
  onImageError(e) {
    console.log('图片加载错误:', e);
  },
  
  // 保存质量验证信息
  async onSave() {
    if (this.data.isSaving) return;
    
    // 表单验证
    if (!this.data.inspectionContent) {
      wx.showToast({
        title: '请输入检查内容',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.inspectionResult) {
      wx.showToast({
        title: '请输入检查结果',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.firstPieceBarcode) {
      wx.showToast({
        title: '请输入首件条码',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.photos.length === 0) {
      wx.showToast({
        title: '请至少上传一张照片',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSaving: true });
    wx.showLoading({ title: '提交中...' });
    
    try {
      // 上传所有图片到云存储
      const uploadTasks = this.data.photos.map((filePath, idx) => {
        return new Promise((resolve, reject) => {
          // 确保再次压缩上传的图片
          wx.compressImage({
            src: filePath,
            quality: 60,
            success: compressRes => {
              // 使用压缩后的图片路径上传
              wx.cloud.uploadFile({
                cloudPath: `breakdown_quality/${Date.now()}_${idx}.jpg`,
                filePath: compressRes.tempFilePath
              }).then(res => {
                resolve(res.fileID);
              }).catch(err => {
                reject(err);
              });
            },
            fail: err => {
              // 压缩失败则上传原图
              wx.cloud.uploadFile({
                cloudPath: `breakdown_quality/${Date.now()}_${idx}.jpg`,
                filePath: filePath
              }).then(res => {
                resolve(res.fileID);
              }).catch(uploadErr => {
                reject(uploadErr);
              });
            }
          });
        });
      });
      
      const fileIDs = await Promise.all(uploadTasks);
      
      // 准备更新数据
      const updateData = {
        id: this.data.recordId,
        inspectionContent: this.data.inspectionContent,
        inspectionResult: this.data.inspectionResult,
        firstPieceBarcode: this.data.firstPieceBarcode,
        inspectionPhotos: fileIDs,
        inspector: this.data.inspector,
        inspectionDate: this.data.inspectionDate,
        inspectionTime: this.data.inspectionTime,
        status: 'completed', // 完成状态
        updateTime: new Date().toISOString()
      };
      
      // 调用云函数更新记录
      const res = await wx.cloud.callFunction({
        name: 'updateBreakdownRecord',
        data: updateData
      });
      
      wx.hideLoading();
      
      if (res && res.result && res.result.success) {
        wx.showToast({
          title: '质检信息提交成功',
          icon: 'success'
        });
        
        // 跳转回列表页
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      } else {
        // 云函数调用失败，保存到本地
        this.saveToLocal(updateData);
      }
    } catch (err) {
      console.error('保存质检信息失败:', err);
      wx.hideLoading();
      // 失败时保存到本地
      this.saveToLocal({
        id: this.data.recordId,
        inspectionContent: this.data.inspectionContent,
        inspectionResult: this.data.inspectionResult,
        firstPieceBarcode: this.data.firstPieceBarcode,
        inspectionPhotos: this.data.photos, // 保存本地图片路径
        inspector: this.data.inspector,
        inspectionDate: this.data.inspectionDate,
        inspectionTime: this.data.inspectionTime,
        status: 'completed',
        updateTime: new Date().toISOString()
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },
  
  // 保存到本地
  saveToLocal(updateData) {
    try {
      const localRecords = wx.getStorageSync('breakdownRecords') || [];
      const index = localRecords.findIndex(r => r.id === this.data.recordId);
      
      if (index !== -1) {
        // 更新现有记录
        localRecords[index] = {
          ...localRecords[index],
          ...updateData
        };
      }
      
      wx.setStorageSync('breakdownRecords', localRecords);
      
      wx.showToast({
        title: '已保存到本地',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (err) {
      console.error('本地保存失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },
  
  // 返回
  onBack() {
    wx.navigateBack({ delta: 1 });
  }
}); 