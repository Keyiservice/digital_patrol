// index.js
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时执行
    console.log('Digital Patrol 页面加载完成');
  },

  // QUA ONLINE PATROL 按钮点击事件
  onQUAPatrol() {
    wx.navigateTo({
      url: '/pages/qua-patrol/qua-patrol'
    });
  },

  // NP MANAGEMENT 按钮点击事件
  onNPManagement() {
    wx.showToast({
      title: 'NP管理功能',
      icon: 'success',
      duration: 2000
    });
    
    // wx.navigateTo({
    //   url: '/pages/np-management/np-management'
    // });
  },

  // MAIN ONLINE PATROL 按钮点击事件
  onMainPatrol() {
    wx.showToast({
      title: '主线巡检功能',
      icon: 'success',
      duration: 2000
    });
    
    // wx.navigateTo({
    //   url: '/pages/main-patrol/main-patrol'
    // });
  },

  // TPM 按钮点击事件
  onTPM() {
    wx.showToast({
      title: 'TPM功能',
      icon: 'success',
      duration: 2000
    });
    
    // wx.navigateTo({
    //   url: '/pages/tpm/tpm'
    // });
  },

  // 登录按钮点击事件
  onSignIn() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 注册按钮点击事件
  onSignUp() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  onShow() {
    // 页面显示时执行
  },

  onReady() {
    // 页面初次渲染完成时执行
  },

  onHide() {
    // 页面隐藏时执行
  },

  onUnload() {
    // 页面卸载时执行
  }
});