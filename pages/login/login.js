// login.js
Page({
  data: {
    formData: {
      accountName: '',
      password: ''
    }
  },

  onLoad() {
    console.log('登录页面加载');
  },

  // 账户名输入
  onAccountNameInput(e) {
    this.setData({
      'formData.accountName': e.detail.value.trim()
    });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      'formData.password': e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    const { accountName, password } = this.data.formData;

    if (!accountName) {
      wx.showToast({
        title: '请输入账户名',
        icon: 'none'
      });
      return false;
    }

    if (accountName.length < 3) {
      wx.showToast({
        title: '账户名至少3个字符',
        icon: 'none'
      });
      return false;
    }

    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return false;
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交登录
  onSubmit() {
    console.log('点击登录按钮');
    if (!this.validateForm()) {
      console.log('表单验证失败');
      return;
    }
    
    wx.showLoading({ title: '登录中...' });

    const { accountName, password } = this.data.formData;

    wx.cloud.callFunction({
      name: 'login',
      data: {
        username: accountName,
        password: password
      },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          // 登录成功
          wx.setStorageSync('isLogin', true);
          wx.setStorageSync('userInfo', { 
            accountName: res.result.user.username, 
            ...res.result.user,
            loginTime: new Date().getTime() 
          });
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1000,
            mask: true,
            complete: () => {
              wx.reLaunch({ url: '/pages/index/index' });
            }
          });
        } else {
          // 登录失败
          wx.showToast({
            title: res.result.message || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '网络或服务错误',
          icon: 'none'
        });
        console.error('登录调用失败:', err);
      }
    });
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  // 忘记密码（可选功能）
  onForgotPassword() {
    wx.showModal({
      title: '忘记密码',
      content: '请联系管理员重置密码',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  onShow() {
    // 页面显示时清空表单（可选）
    // this.setData({
    //   formData: {
    //     accountName: '',
    //     password: ''
    //   }
    // });
  },

  onReady() {
    // 页面初次渲染完成
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面卸载
  }
});