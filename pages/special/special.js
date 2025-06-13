// pages/special/special.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    flowMark: '',
    silverStreak: '',
    blackDot: '',
    bubble: '',
    discoloration: '',
    previousPageData: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取上一页传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromPreviousPage', (data) => {
      this.setData({
        previousPageData: data.data
      });
    });
  },

  /**
   * 处理单选按钮变化
   */
  onFlowMarkChange: function(e) {
    this.setData({
      flowMark: e.detail.value
    });
  },

  onSilverStreakChange: function(e) {
    this.setData({
      silverStreak: e.detail.value
    });
  },

  onBlackDotChange: function(e) {
    this.setData({
      blackDot: e.detail.value
    });
  },

  onBubbleChange: function(e) {
    this.setData({
      bubble: e.detail.value
    });
  },

  onDiscolorationChange: function(e) {
    this.setData({
      discoloration: e.detail.value
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.flowMark) {
      wx.showToast({
        title: '请选择FLOW MARK状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.silverStreak) {
      wx.showToast({
        title: '请选择SILVER STREAK状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.blackDot) {
      wx.showToast({
        title: '请选择BLACK DOT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.bubble) {
      wx.showToast({
        title: '请选择BUBBLE状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.discoloration) {
      wx.showToast({
        title: '请选择DISCOLORATION状态',
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
    
    // 合并数据并跳转到下一页
    const combinedData = {
      ...this.data.previousPageData,
      flowMark: this.data.flowMark,
      silverStreak: this.data.silverStreak,
      blackDot: this.data.blackDot,
      bubble: this.data.bubble,
      discoloration: this.data.discoloration
    };
    
    wx.navigateTo({
      url: '/pages/fc/fc',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: combinedData });
      }
    });
  }
}) 