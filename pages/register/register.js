// register.js
Page({
  data: {
    formData: {
      name: '',
      plant: '',
      password: '',
      confirmPassword: ''
    },
    departmentOptions: ['Production', 'Engineering', 'Quality', 'Logistic', 'GM', 'HR', 'Safety', 'Finance'],
    departmentIndex: -1, // -1 or null to show placeholder
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

  // 部门选择
  onDepartmentChange(e) {
    this.setData({
      departmentIndex: e.detail.value
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
    const { departmentIndex } = this.data;

    if (!name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }

    if (name.length < 2) {
      wx.showToast({ title: '姓名至少2个字符', icon: 'none' });
      return false;
    }

    if (!plant) {
      wx.showToast({ title: '请输入工厂信息', icon: 'none' });
      return false;
    }

    if (departmentIndex === -1) {
      wx.showToast({ title: '请选择部门', icon: 'none' });
      return false;
    }

    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return false;
    }

    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return false;
    }

    if (!confirmPassword) {
      wx.showToast({ title: '请确认密码', icon: 'none' });
      return false;
    }

    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交注册
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }
    
    wx.showLoading({ title: '注册中...' });

    const { name, plant, password } = this.data.formData;
    const department = this.data.departmentOptions[this.data.departmentIndex];

    wx.cloud.callFunction({
      name: 'signUp',
      data: {
        username: name,
        password: password,
        plant: plant,
        department: department
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({ title: '注册成功', icon: 'success', duration: 2000 });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/login/login' });
          }, 2000);
        } else {
          wx.showToast({ title: res.result.message || '注册失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '调用服务失败', icon: 'none' });
        console.error('注册失败:', err);
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