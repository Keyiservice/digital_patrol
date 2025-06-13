// pages/thickness/thickness.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    point1: '',
    point2: '',
    point3: '',
    point4: '',
    point5: '',
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
   * 处理输入框变化
   */
  onPoint1Input: function(e) {
    this.setData({
      point1: e.detail.value
    });
  },

  onPoint2Input: function(e) {
    this.setData({
      point2: e.detail.value
    });
  },

  onPoint3Input: function(e) {
    this.setData({
      point3: e.detail.value
    });
  },

  onPoint4Input: function(e) {
    this.setData({
      point4: e.detail.value
    });
  },

  onPoint5Input: function(e) {
    this.setData({
      point5: e.detail.value
    });
  },
  
  /**
   * 验证表单是否填写完整且有效
   */
  validateForm: function() {
    // 检查是否为空
    if (!this.data.point1.trim()) {
      wx.showToast({
        title: '请输入POINT 1的厚度值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.point2.trim()) {
      wx.showToast({
        title: '请输入POINT 2的厚度值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.point3.trim()) {
      wx.showToast({
        title: '请输入POINT 3的厚度值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.point4.trim()) {
      wx.showToast({
        title: '请输入POINT 4的厚度值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.point5.trim()) {
      wx.showToast({
        title: '请输入POINT 5的厚度值',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    // 检查是否为有效数字
    const points = [
      { value: this.data.point1, name: 'POINT 1' },
      { value: this.data.point2, name: 'POINT 2' },
      { value: this.data.point3, name: 'POINT 3' },
      { value: this.data.point4, name: 'POINT 4' },
      { value: this.data.point5, name: 'POINT 5' }
    ];
    
    for (let point of points) {
      const num = parseFloat(point.value);
      if (isNaN(num) || num <= 0) {
        wx.showToast({
          title: `${point.name}的厚度值无效`,
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
    
    // 合并数据并跳转到下一页
    const combinedData = {
      ...this.data.previousPageData,
      point1: this.data.point1,
      point2: this.data.point2,
      point3: this.data.point3,
      point4: this.data.point4,
      point5: this.data.point5
    };
    
    wx.navigateTo({
      url: '/pages/special/special',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: combinedData });
      }
    });
  }
}) 