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
    if (!this.validateForm()) {
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '登录中...'
    });

    // 模拟API请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 这里应该调用实际的登录API
      console.log('登录数据:', this.data.formData);
      
      // 模拟登录验证
      const { accountName, password } = this.data.formData;
      
      // 简单的模拟验证（实际开发中应该调用后端API）
      if (accountName === 'admin' && password === '123456') {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });

        // 保存登录状态（实际开发中应该保存token）
        wx.setStorageSync('isLogin', true);
        wx.setStorageSync('userInfo', {
          accountName: accountName,
          loginTime: new Date().getTime()
        });

        // 登录成功后跳转到主页面
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 2000);
      } else {
        wx.showToast({
          title: '账户名或密码错误',
          icon: 'none'
        });
      }
    }, 1500);
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