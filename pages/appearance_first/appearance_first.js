// pages/appearance_first/appearance_first.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    scratch: '',
    dent: '',
    stain: '',
    foreignMaterial: '',
    appearanceDefect: '',
    previousPageData: null, // 存储上一页传递的数据
    
    // 照片存储
    scratchPhoto: '',
    dentPhoto: '',
    stainPhoto: '',
    foreignMaterialPhoto: '',
    appearanceDefectPhoto: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return;
    }
    
    // 获取上一页传递的参数
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromPreviousPage', (data) => {
      console.log('接收到上一页数据:', data);
      this.setData({
        previousPageData: data.data
      });
    });
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 再次检查登录状态
    const app = getApp();
    app.checkLoginStatus();
  },

  /**
   * 处理单选按钮变化
   */
  onScratchChange: function(e) {
    this.setData({
      scratch: e.detail.value
    });
  },

  onDentChange: function(e) {
    this.setData({
      dent: e.detail.value
    });
  },

  onStainChange: function(e) {
    this.setData({
      stain: e.detail.value
    });
  },

  onForeignMaterialChange: function(e) {
    this.setData({
      foreignMaterial: e.detail.value
    });
  },

  onAppearanceDefectChange: function(e) {
    this.setData({
      appearanceDefect: e.detail.value
    });
  },
  
  /**
   * 拍照功能
   */
  takePhoto: function(e) {
    const item = e.currentTarget.dataset.item;
    const that = this;
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        console.log('拍照成功:', res);
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 根据不同的检查项保存照片路径
        const photoData = {};
        photoData[`${item}Photo`] = tempFilePath;
        
        that.setData(photoData);
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 预览图片
   */
  previewImage: function(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.scratch) {
      wx.showToast({
        title: '请选择SCRATCH状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.dent) {
      wx.showToast({
        title: '请选择DENT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.stain) {
      wx.showToast({
        title: '请选择STAIN状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.foreignMaterial) {
      wx.showToast({
        title: '请选择FOREIGN MATERIAL状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.appearanceDefect) {
      wx.showToast({
        title: '请选择APPEARANCE DEFECT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    return true;
  },

  /**
   * 处理上一页按钮点击
   */
  onPrevious: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 处理下一页按钮点击
   */
  onNext: function() {
    // 验证表单
    if (!this.validateForm()) {
      return;
    }
    
    // 保存数据并跳转到下一页
    const data = {
      ...this.data.previousPageData, // 包含上一页的数据
      scratch: this.data.scratch,
      dent: this.data.dent,
      stain: this.data.stain,
      foreignMaterial: this.data.foreignMaterial,
      appearanceDefect: this.data.appearanceDefect,
      // 添加照片数据
      scratchPhoto: this.data.scratchPhoto,
      dentPhoto: this.data.dentPhoto,
      stainPhoto: this.data.stainPhoto,
      foreignMaterialPhoto: this.data.foreignMaterialPhoto,
      appearanceDefectPhoto: this.data.appearanceDefectPhoto
    };
    
    wx.navigateTo({
      url: '/pages/appearance_second/appearance_second',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  }
}) 