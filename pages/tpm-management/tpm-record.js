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
    // 页面模式：view（查看）或edit（编辑）
    mode: 'add',
    // 记录ID，编辑或查看时有值
    recordId: '',
    isViewMode: false,
    isEditMode: false
  },

  onLoad(options) {
    console.log('[TPM记录] 页面加载, options:', options);
    // 初始化日期、时间、保养人
    const now = new Date();
    
    // 设置页面模式
    const mode = options?.mode || 'add';
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    
    this.setData({
      currentDate: util.formatDate(now),
      currentTime: util.formatTime(now).substring(11, 16),
      maintainer: wx.getStorageSync('userInfo')?.accountName || '',
      mode: mode,
      isViewMode: isViewMode,
      isEditMode: isEditMode,
      recordId: options?.id || ''
    });
    
    // 若有id参数，加载详情
    if (options && options.id) {
      this.fetchDetail(options.id);
    }
  },

  // 查看按钮状态（禁用状态）
  shouldDisableControls() {
    return this.data.isViewMode;
  },

  async fetchDetail(id) {
    console.log('[TPM记录] 获取记录详情, id:', id);
    // 本地记录
    if (id.toString().startsWith('local_')) {
      return this.getLocalRecord(id);
    }
    
    // 云端记录
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.callFunction({ name: 'getTpmRecords', data: { id } });
      wx.hideLoading();
      console.log('[TPM记录] 获取详情结果:', res);
      
      if (res && res.result && res.result.data) {
        const record = Array.isArray(res.result.data) ? res.result.data.find(r => r._id === id) : res.result.data;
        if (record) {
          this.setRecordData(record);
        } else {
          wx.showToast({ title: '记录不存在', icon: 'error' });
        }
      }
    } catch (e) {
      console.error('[TPM记录] 获取详情失败:', e);
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  
  // 获取本地记录
  getLocalRecord(id) {
    const localRecords = wx.getStorageSync('tpmRecords') || [];
    const record = localRecords.find(r => r.id === id);
    
    if (record) {
      this.setRecordData(record);
    } else {
      wx.showToast({ title: '本地记录不存在', icon: 'error' });
    }
  },
  
  // 设置记录数据到表单
  setRecordData(record) {
    const projectIndex = this.data.projectOptions.findIndex(p => p === record.project);
    let deviceOptions = this.data.deviceMap[record.project] || [];
    const deviceIndex = deviceOptions.findIndex(d => d === record.device);
    
    // 处理错误的图片路径
    let photos = record.photos || [];
    if (Array.isArray(photos)) {
      photos = photos.map(photoUrl => {
        if (photoUrl && photoUrl.includes('your-env-id')) {
          return ''; // 返回空字符串，或者可以设置为默认图片路径
        }
        return photoUrl;
      }).filter(url => url); // 过滤掉空字符串
    }
    
    this.setData({
      projectIndex: projectIndex >= 0 ? projectIndex : 0,
      deviceOptions,
      deviceIndex: deviceIndex >= 0 ? deviceIndex : 0,
      currentDate: record.date,
      currentTime: record.time,
      maintainer: record.maintainer,
      photos: photos
    });
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

  onMaintainerChange(e) {
    this.setData({
      maintainer: e.detail.value
    });
  },
  
  // 多图上传
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
        // 处理选择的图片
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
    // 可以在这里设置默认图片
    // e.target.setData({ src: '/images/default_image.png' });
  },

  // 退出
  onExit() {
    if (this.data.isViewMode) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    
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
    console.log('[TPM保存] 开始保存');
    try {
      console.log('[TPM保存] 准备上传图片');
      // 上传所有图片到云存储
      const uploadTasks = this.data.photos.map((filePath, idx) => {
        console.log(`[TPM保存] 上传图片${idx+1}/${this.data.photos.length}`);
        return new Promise((resolve, reject) => {
          // 确保再次压缩上传的图片
          wx.compressImage({
            src: filePath,
            quality: 60,
            success: compressRes => {
              // 使用压缩后的图片路径上传
              wx.cloud.uploadFile({
                cloudPath: `tpm_evidence/${Date.now()}_${idx}.jpg`,
                filePath: compressRes.tempFilePath
              }).then(res => {
                console.log(`[TPM保存] 图片${idx+1}上传成功:`, res.fileID);
                resolve(res.fileID);
              }).catch(err => {
                console.error(`[TPM保存] 图片${idx+1}上传失败:`, err);
                reject(err);
              });
            },
            fail: err => {
              console.error(`[TPM保存] 图片${idx+1}压缩失败:`, err);
              // 压缩失败则上传原图
              wx.cloud.uploadFile({
                cloudPath: `tpm_evidence/${Date.now()}_${idx}.jpg`,
                filePath: filePath
              }).then(res => {
                console.log(`[TPM保存] 原图${idx+1}上传成功:`, res.fileID);
                resolve(res.fileID);
              }).catch(uploadErr => {
                console.error(`[TPM保存] 原图${idx+1}上传失败:`, uploadErr);
                reject(uploadErr);
              });
            }
          });
        });
      });
      
      console.log('[TPM保存] 等待所有图片上传');
      const fileIDs = await Promise.all(uploadTasks);
      console.log('[TPM保存] 所有图片上传成功, IDs:', fileIDs);

      // 准备保存数据
      const saveData = {
        project: this.data.projectOptions[this.data.projectIndex],
        device: this.data.deviceOptions[this.data.deviceIndex],
        date: this.data.currentDate,
        time: this.data.currentTime,
        maintainer: this.data.maintainer,
        photos: fileIDs,
        createTime: new Date().toISOString()
      };
      console.log('[TPM保存] 准备调用云函数, 数据:', saveData);
      
      // 调用云函数保存记录
      console.log('[TPM保存] 调用saveTpmRecord云函数');
      wx.cloud.callFunction({
        name: 'saveTpmRecord',
        data: saveData,
        success: res => {
          console.log('[TPM保存] saveTpmRecord调用成功, 结果:', res);
          wx.hideLoading();
          if (res.result && res.result.success) {
            // 云端保存成功
            wx.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack({ delta: 1 });
            }, 1500);
          } else {
            // 云端返回但失败
            console.error('[TPM保存] 云函数返回失败:', res.result);
            // 保存到本地
            this.saveToLocal(saveData);
          }
        },
        fail: err => {
          // 云函数调用失败
          console.error('[TPM保存] saveTpmRecord调用失败:', err);
          wx.hideLoading();
          // 保存到本地
          this.saveToLocal(saveData);
        }
      });
    } catch (e) {
      console.error('[TPM保存] 出现异常:', e);
      wx.hideLoading();
      // 云端异常，保存到本地
      const saveData = {
        project: this.data.projectOptions[this.data.projectIndex],
        device: this.data.deviceOptions[this.data.deviceIndex],
        date: this.data.currentDate,
        time: this.data.currentTime,
        maintainer: this.data.maintainer,
        photos: this.data.photos,  // 保存本地图片路径
        createTime: Date.now(),
        id: 'local_' + Date.now()
      };
      this.saveToLocal(saveData);
    }
    this.setData({ isSaving: false });
  },
  
  // 保存到本地
  saveToLocal(data) {
    console.log('[TPM保存] 保存到本地:', data);
    const localRecords = wx.getStorageSync('tpmRecords') || [];
    localRecords.push(data);
    wx.setStorageSync('tpmRecords', localRecords);
    wx.showToast({ title: '已保存到本地', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 1500);
  },
});
