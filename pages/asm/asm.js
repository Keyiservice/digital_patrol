// pages/asm/asm.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    assemblyDefect: '',
    missingParts: '',
    wrongParts: '',
    damagedParts: '',
    functionTest: '',
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
  onAssemblyDefectChange: function(e) {
    this.setData({
      assemblyDefect: e.detail.value
    });
  },

  onMissingPartsChange: function(e) {
    this.setData({
      missingParts: e.detail.value
    });
  },

  onWrongPartsChange: function(e) {
    this.setData({
      wrongParts: e.detail.value
    });
  },

  onDamagedPartsChange: function(e) {
    this.setData({
      damagedParts: e.detail.value
    });
  },

  onFunctionTestChange: function(e) {
    this.setData({
      functionTest: e.detail.value
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.assemblyDefect) {
      wx.showToast({
        title: '请选择ASSEMBLY DEFECT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.missingParts) {
      wx.showToast({
        title: '请选择MISSING PARTS状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.wrongParts) {
      wx.showToast({
        title: '请选择WRONG PARTS状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.damagedParts) {
      wx.showToast({
        title: '请选择DAMAGED PARTS状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.functionTest) {
      wx.showToast({
        title: '请选择FUNCTION TEST状态',
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
    
    // 合并所有数据，这是最后一页，可以提交数据或返回首页
    const finalData = {
      ...this.data.previousPageData,
      assemblyDefect: this.data.assemblyDefect,
      missingParts: this.data.missingParts,
      wrongParts: this.data.wrongParts,
      damagedParts: this.data.damagedParts,
      functionTest: this.data.functionTest
    };
    
    // 这里可以添加数据提交逻辑
    console.log('提交的最终数据:', finalData);
    
    // 提交完成后返回首页
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000,
      success: function() {
        setTimeout(function() {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }, 2000);
      }
    });
  }
}) 