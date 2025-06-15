// pages/qua-patrol/qua-patrol.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin: false,
    userName: '',
    items: [
      {
        id: 1,
        description: '通用检查项: 请根据实际情况进行检查并选择结果。',
        result: '',
        photos: []
      }
    ],
    previousPageData: null // 存储上一页传递的数据
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
  onResultChange(e) {
    const { itemIndex } = e.currentTarget.dataset;
    const value = e.detail.value;
    const { items } = this.data;
    items[itemIndex].result = value;
    this.setData({ items });
  },
  
  /**
   * 拍照功能
   */
  takePhoto: function(e) {
    const { itemIndex } = e.currentTarget.dataset;
    const { items } = this.data;
    const currentPhotos = items[itemIndex].photos || [];

    wx.chooseImage({
      count: 5 - currentPhotos.length, // 最多选择5张，减去已有的照片数
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newPhotos = currentPhotos.concat(tempFilePaths);
        items[itemIndex].photos = newPhotos.slice(0, 5); // 确保不超过5张
        this.setData({ items });
      }
    });
  },
  
  /**
   * 预览图片
   */
  previewImage: function(e) {
    const { itemIndex, photoIndex } = e.currentTarget.dataset;
    const { items } = this.data;
    const current = items[itemIndex].photos[photoIndex];
    const urls = items[itemIndex].photos; // 预览所有照片
    wx.previewImage({
      current: current,
      urls: urls
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    for (let i = 0; i < this.data.items.length; i++) {
      if (!this.data.items[i].result) {
        wx.showToast({
          title: `请选择第${i + 1}项检查结果`,
          icon: 'none',
          duration: 2000
        });
        return false;
      }
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
      quaPatrolItems: this.data.items
    };
    
    wx.navigateTo({
      url: '/pages/summary/summary',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  }
})