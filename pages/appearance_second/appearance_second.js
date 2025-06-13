// pages/appearance_second/appearance_second.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    crack: '',
    flash: '',
    sinkMark: '',
    weldLine: '',
    deformation: '',
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
  onCrackChange: function(e) {
    this.setData({
      crack: e.detail.value
    });
  },

  onFlashChange: function(e) {
    this.setData({
      flash: e.detail.value
    });
  },

  onSinkMarkChange: function(e) {
    this.setData({
      sinkMark: e.detail.value
    });
  },

  onWeldLineChange: function(e) {
    this.setData({
      weldLine: e.detail.value
    });
  },

  onDeformationChange: function(e) {
    this.setData({
      deformation: e.detail.value
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.crack) {
      wx.showToast({
        title: '请选择CRACK状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.flash) {
      wx.showToast({
        title: '请选择FLASH状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.sinkMark) {
      wx.showToast({
        title: '请选择SINK MARK状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.weldLine) {
      wx.showToast({
        title: '请选择WELD LINE状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.deformation) {
      wx.showToast({
        title: '请选择DEFORMATION状态',
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
      crack: this.data.crack,
      flash: this.data.flash,
      sinkMark: this.data.sinkMark,
      weldLine: this.data.weldLine,
      deformation: this.data.deformation
    };
    
    wx.navigateTo({
      url: '/pages/thickness/thickness',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: combinedData });
      }
    });
  }
}) 