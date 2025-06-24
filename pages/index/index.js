// index.js
Page({
  data: {
    isLogin: false,
    userName: ''
  },

  onLoad() {
    // 页面加载时执行
    console.log('Digital Patrol 页面加载完成');
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const isLogin = wx.getStorageSync('isLogin') || false;
    if (isLogin) {
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        isLogin: true,
        userName: userInfo.accountName || '用户'
      });
    } else {
      this.setData({
        isLogin: false,
        userName: ''
      });
    }
  },

  // QUA ONLINE PATROL 按钮点击事件
  onQUAPatrol() {
    // 检查是否已登录
    if (!this.data.isLogin) {
      this.showLoginRequiredToast();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/qua-patrol/qua-patrol',
      success: function(res) {
        // 传递初始化空数据
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: {} });
      }
    });
  },

  // NP MANAGEMENT 按钮点击事件
  onNPManagement() {
    // 检查是否已登录
    if (!this.data.isLogin) {
      this.showLoginRequiredToast();
      return;
    }
    
    // 导航到不合格品管理列表页面
    wx.navigateTo({
      url: '/pages/np-management/np-list'
    });
  },

  // MAIN ONLINE PATROL 按钮点击事件
  onMainPatrol() {
    // 检查是否已登录
    if (!this.data.isLogin) {
      this.showLoginRequiredToast();
      return;
    }
    
    // 导航到主线巡检页面
    wx.navigateTo({
      url: '/pages/main-patrol/main-patrol'
    });
  },

  // TPM 按钮点击事件
  onTPM() {
    // 检查是否已登录
    if (!this.data.isLogin) {
      this.showLoginRequiredToast();
      return;
    }
    
    // 导航到故障管理列表页面
    wx.navigateTo({
      url: '/pages/breakdown-management/breakdown-list'
    });
  },
  
  // 显示需要登录的提示
  showLoginRequiredToast() {
    wx.showModal({
      title: '需要登录',
      content: '请先登录后再使用此功能',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
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
  
  // 退出登录按钮点击事件
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('isLogin');
          wx.removeStorageSync('userInfo');
          
          // 更新页面状态
          this.setData({
            isLogin: false,
            userName: ''
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  onShow() {
    // 页面显示时执行，每次回到这个页面时检查登录状态
    this.checkLoginStatus();
  },

  onReady() {
    // 页面初次渲染完成时执行
  },

  onHide() {
    // 页面隐藏时执行
  },

  onUnload() {
    // 页面卸载时执行
  },

  onGoTpmList() {
    wx.navigateTo({ url: '/pages/tpm-management/tpm-list' });
  }
});