Page({
  /**
   * 页面的初始数据
   */
  data: {
    tNumber: '',
    cookieNumber: '',
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
  onShow: function () {
    // 再次检查登录状态
    const app = getApp();
    app.checkLoginStatus();
  },

  /**
   * 处理T-Number输入
   */
  onTNumberInput: function(e) {
    this.setData({
      tNumber: e.detail.value
    });
  },

  /**
   * 处理Cookie Number输入
   */
  onCookieNumberInput: function(e) {
    this.setData({
      cookieNumber: e.detail.value
    });
  },

  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.tNumber) {
      wx.showToast({
        title: '请输入T-NUMBER',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.cookieNumber) {
      wx.showToast({
        title: '请输入COOKIE NUMBER',
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
      tNumber: this.data.tNumber,
      cookieNumber: this.data.cookieNumber
    };
    
    wx.navigateTo({
      url: '/pages/appearance_first/appearance_first',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  }
}); 