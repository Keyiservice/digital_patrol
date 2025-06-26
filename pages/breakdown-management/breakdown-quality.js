const util = require('../../utils/util.js');

Page({
  data: {
    // ---- 状态控制 ----
    mode: 'edit', // 'edit' 或 'view'
    recordId: null,
    isSaving: false,

    // ---- 数据模型 ----
    recordDetail: {}, // 存储完整记录，用于显示历史信息
    
    // 质检表单字段
    inspectionContent: '', // **恢复"检查内容"字段**
    qualityCheckResult: 'OK',
    qualityCheckNotes: '', // 备注字段，以备将来使用
    firstPieceBarcode: '',
    photos: [],
    qualityChecker: '',
    checkDate: '',
    checkTime: ''
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '无效的记录ID', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const mode = options.mode || 'edit';
    this.setData({
      recordId: options.id,
      mode: mode,
    });
    wx.setNavigationBarTitle({
      title: mode === 'view' ? '查看质检信息' : '质量验证'
    });

    this.loadRecord(options.id);

    if (mode === 'edit') {
      const now = new Date();
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        qualityChecker: userInfo.accountName || '未知用户',
        checkDate: util.formatDate(now),
        checkTime: util.formatTime(now).substring(11, 16)
      });
    }
  },
  
  loadRecord(id) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getBreakdownRecord',
      data: { id: id },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const record = res.result.data;
          
          // 统一的数据填充逻辑
          this.setData({
            // 历史信息
            recordDetail: record,
            inspectionContent: record.inspectionContent || '', // **恢复加载"检查内容"**

            // 质检表单信息 (无论 edit/view 模式，都从记录中读取)
            qualityCheckResult: record.qualityCheckResult || 'OK', // 如果没有，默认为OK
            firstPieceBarcode: record.firstPieceBarcode || '',
            photos: record.inspectionPhotos || [], // **关键：从 record.inspectionPhotos 加载图片**
            qualityCheckNotes: record.qualityCheckNotes || '', // 加载备注

            // 自动填充的字段，也从记录中读取，保证查看时显示的是当时的时间
            qualityChecker: record.qualityChecker || this.data.qualityChecker,
            checkDate: record.checkDate || this.data.checkDate,
            checkTime: record.checkTime || this.data.checkTime
          });
        } else {
          wx.showToast({ title: '记录加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
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
    
    // **恢复对"检查内容"的验证**
    if (!this.data.inspectionContent) {
      wx.showToast({
        title: '请输入检查内容',
        icon: 'none'
      });
      return;
    }
    
    // 表单验证
    if (!this.data.firstPieceBarcode) {
      wx.showToast({
        title: '请输入或扫描首件条码',
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
      
      // 准备更新数据 (使用正确的字段)
      const updateData = {
        id: this.data.recordId,
        inspectionContent: this.data.inspectionContent, // **恢复保存"检查内容"**
        qualityCheckResult: this.data.qualityCheckResult,
        qualityCheckNotes: this.data.qualityCheckNotes,
        firstPieceBarcode: this.data.firstPieceBarcode,
        inspectionPhotos: fileIDs,
        qualityChecker: this.data.qualityChecker,
        checkDate: this.data.checkDate,
        checkTime: this.data.checkTime,
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
        inspectionContent: this.data.inspectionContent, // **恢复保存"检查内容"**
        qualityCheckResult: this.data.qualityCheckResult,
        qualityCheckNotes: this.data.qualityCheckNotes,
        firstPieceBarcode: this.data.firstPieceBarcode,
        inspectionPhotos: this.data.photos, // 保存本地图片路径
        qualityChecker: this.data.qualityChecker,
        checkDate: this.data.checkDate,
        checkTime: this.data.checkTime,
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
  },

  // 新增：处理检查结果 OK/NG 变化
  onResultChange(e) {
    this.setData({
      qualityCheckResult: e.detail.value
    });
  },

  // 新增：处理扫描条码事件
  onScanBarcode() {
    wx.scanCode({
      onlyFromCamera: false, // 允许从相册选择
      scanType: ['barCode', 'qrCode'], // 支持一维码和二维码
      success: res => {
        this.setData({
          firstPieceBarcode: res.result
        });
        wx.showToast({ title: '扫描成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '扫描失败', icon: 'none' });
      }
    });
  }
}); 