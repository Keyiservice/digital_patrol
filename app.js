// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null
  },
  
  // 全局登录检查函数
  checkLoginStatus: function() {
    const isLogin = wx.getStorageSync('isLogin') || false;
    if (!isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再使用此功能',
        confirmText: '去登录',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return false;
    }
    return true;
  }
})
