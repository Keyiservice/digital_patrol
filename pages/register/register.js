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

    // 显示加载中
    wx.showLoading({
      title: '注册中...'
    });

    // 模拟API请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 这里应该调用实际的注册API
      console.log('注册数据:', this.data.formData);
      
      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 2000
      });

      // 注册成功后跳转到登录页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 2000);
    }, 1500);
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