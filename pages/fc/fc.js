// pages/fc/fc.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    solderDefect: '',
    missingComponent: '',
    wrongComponent: '',
    damagedComponent: '',
    misalignment: '',
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
  onSolderDefectChange: function(e) {
    this.setData({
      solderDefect: e.detail.value
    });
  },

  onMissingComponentChange: function(e) {
    this.setData({
      missingComponent: e.detail.value
    });
  },

  onWrongComponentChange: function(e) {
    this.setData({
      wrongComponent: e.detail.value
    });
  },

  onDamagedComponentChange: function(e) {
    this.setData({
      damagedComponent: e.detail.value
    });
  },
  
  onMisalignmentChange: function(e) {
    this.setData({
      misalignment: e.detail.value
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.solderDefect) {
      wx.showToast({
        title: '请选择SOLDER DEFECT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.missingComponent) {
      wx.showToast({
        title: '请选择MISSING COMPONENT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.wrongComponent) {
      wx.showToast({
        title: '请选择WRONG COMPONENT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.damagedComponent) {
      wx.showToast({
        title: '请选择DAMAGED COMPONENT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.misalignment) {
      wx.showToast({
        title: '请选择MISALIGNMENT状态',
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
    
    // 合并数据并跳转到下一页 (暂时用ASM作为FC第二页)
    const combinedData = {
      ...this.data.previousPageData,
      solderDefect: this.data.solderDefect,
      missingComponent: this.data.missingComponent,
      wrongComponent: this.data.wrongComponent,
      damagedComponent: this.data.damagedComponent,
      misalignment: this.data.misalignment,
      fcPageOne: true // 标记已经过了FC第一页
    };
    
    wx.navigateTo({
      url: '/pages/asm/asm',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: combinedData });
      }
    });
  }
}) 