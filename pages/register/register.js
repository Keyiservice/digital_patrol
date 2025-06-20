// register.js
Page({
  data: {
    formData: {
      name: '',
      plant: '',
      password: '',
      confirmPassword: ''
    }
  },

  onLoad() {
    console.log('注册页面加载');
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value.trim()
    });
  },

  // 工厂输入
  onPlantInput(e) {
    this.setData({
      'formData.plant': e.detail.value.trim()
    });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      'formData.password': e.detail.value
    });
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      'formData.confirmPassword': e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    const { name, plant, password, confirmPassword } = this.data.formData;

    if (!name) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return false;
    }

    if (name.length < 2) {
      wx.showToast({
        title: '姓名至少2个字符',
        icon: 'none'
      });
      return false;
    }

    if (!plant) {
      wx.showToast({
        title: '请输入工厂信息',
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

    if (!confirmPassword) {
      wx.showToast({
        title: '请确认密码',
        icon: 'none'
      });
      return false;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交注册
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }
    const { name, plant, password } = this.data.formData;
    wx.showLoading({ title: '注册中...' });
    // 先检查用户名是否已存在
    wx.cloud.database().collection('users').where({ name }).get({
      success: res => {
        if (res.data && res.data.length > 0) {
          wx.hideLoading();
          wx.showToast({ title: '该用户已注册', icon: 'none' });
        } else {
          // 写入新用户
          wx.cloud.database().collection('users').add({
            data: { name, plant, password },
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: '注册成功', icon: 'success', duration: 2000 });
              setTimeout(() => {
                wx.redirectTo({ url: '/pages/login/login' });
              }, 2000);
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '注册失败', icon: 'none' });
            }
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  onShow() {
    // 页面显示
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