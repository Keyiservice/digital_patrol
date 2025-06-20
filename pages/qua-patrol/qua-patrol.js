// pages/qua-patrol/qua-patrol.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin: false,
    userName: '',
    projectSelected: '', // 选择的项目
    processSelected: '', // 选择的流程
    shiftSelected: '',   // 选择的班次
    items: [
      {
        id: 1,
        description: '', // 这里后续动态赋值
        result: '',
        photos: []
      }
    ],
    previousPageData: null, // 存储上一页传递的数据
    currentDate: '', // 当前日期
    currentTime: ''  // 当前时间
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
    try {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('acceptDataFromPreviousPage', (data) => {
        console.log('接收到上一页数据:', data);
        this.setData({
          previousPageData: data.data || {}
        });
      });
    } catch (error) {
      console.error('获取上一页数据失败:', error);
      this.setData({
        previousPageData: {}
      });
    }
    this.updateDateTime();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 再次检查登录状态
    const app = getApp();
    app.checkLoginStatus();
    this.updateDateTime();
  },

  /**
   * 处理项目选择变化
   */
  onProjectChange: function(e) {
    this.setData({
      projectSelected: e.detail.value
    });
  },

  /**
   * 处理流程选择变化
   */
  onProcessChange: function(e) {
    this.setData({
      processSelected: e.detail.value
    });
  },

  /**
   * 处理班次选择变化
   */
  onShiftChange: function(e) {
    this.setData({
      shiftSelected: e.detail.value
    });
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
    if (!this.data.projectSelected) {
      wx.showToast({
        title: '请选择项目',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.processSelected) {
      wx.showToast({
        title: '请选择流程',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.shiftSelected) {
      wx.showToast({
        title: '请选择班次',
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
    
    // 保存选择数据
    const data = {
      ...this.data.previousPageData, // 包含上一页的数据
      projectSelected: this.data.projectSelected,
      processSelected: this.data.processSelected,
      shiftSelected: this.data.shiftSelected
    };
    
    // 根据选择的流程决定跳转路径
    let nextPage = '';
    
    switch (this.data.processSelected) {
      case 'BMM':
        nextPage = '/pages/appearance_first/appearance_first';
        break;
      case 'FC':
        nextPage = '/pages/fc/fc';
        break;
      case 'ASM':
        nextPage = '/pages/asm/asm';
        break;
      default:
        wx.showToast({
          title: '请选择有效的流程',
          icon: 'none',
          duration: 2000
        });
        return;
    }
    
    wx.navigateTo({
      url: nextPage,
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  },

  /**
   * 更新时间方法
   */
  updateDateTime: function() {
    const now = new Date();
    const pad = n => n < 10 ? '0' + n : n;
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    this.setData({
      currentDate: date,
      currentTime: time,
      'items[0].description': `日期：${date}  时间：${time}`
    });
  }
})