// pages/thickness/thickness.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin: false,
    userName: '',
    items: [
      {
        id: 'point1',
        name: '测量点1',
        unit: 'mm',
        value: '',
        description: '测量点1 (mm)'  // 用于显示，可以根据数据库中的名称动态生成
      },
      {
        id: 'point2',
        name: '测量点2',
        unit: 'mm',
        value: '',
        description: '测量点2 (mm)'
      },
      {
        id: 'point3',
        name: '测量点3',
        unit: 'mm',
        value: '',
        description: '测量点3 (mm)'
      },
      {
        id: 'point4',
        name: '测量点4',
        unit: 'mm',
        value: '',
        description: '测量点4 (mm)'
      },
      {
        id: 'point5',
        name: '测量点5',
        unit: 'mm',
        value: '',
        description: '测量点5 (mm)'
      }
    ],
    previousPageData: null // 存储上一页传递的数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return;
    }
    
    // 获取上一页传递的参数
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromPreviousPage', (data) => {
      console.log('接收到上一页数据:', data);
      this.setData({
        previousPageData: data.data
      });
    });

    // 这里可以添加从数据库获取测量点配置的代码
    // this.loadMeasurementPoints();
  },

  /**
   * 从数据库加载测量点配置
   */
  loadMeasurementPoints: function() {
    // 示例：从数据库获取测量点配置
    wx.request({
      url: 'your-api-endpoint/measurement-points',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.length > 0) {
          // 更新测量点配置
          const items = res.data.map(point => ({
            id: point.id,
            name: point.name,
            unit: point.unit || 'mm',
            value: '',
            description: `${point.name} (${point.unit || 'mm'})`
          }));
          this.setData({ items });
        }
      }
    });
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 再次检查登录状态
    const app = getApp();
    app.checkLoginStatus();
  },

  /**
   * 处理输入框变化
   */
  onInputChange(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const { items } = this.data;
    items[index].value = value;
    this.setData({ items });
  },
  
  /**
   * 验证表单是否填写完整且有效
   */
  validateForm: function() {
    // 检查是否为空
    for (let i = 0; i < this.data.items.length; i++) {
      if (!this.data.items[i].value.trim()) {
        wx.showToast({
          title: `请输入${this.data.items[i].name}的厚度值`,
          icon: 'none',
          duration: 2000
        });
        return false;
      }
    }
    
    // 检查是否为有效数字
    for (let i = 0; i < this.data.items.length; i++) {
      const num = parseFloat(this.data.items[i].value);
      if (isNaN(num) || num <= 0) {
        wx.showToast({
          title: `${this.data.items[i].name}的厚度值无效`,
          icon: 'none',
          duration: 2000
        });
        return false;
      }
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
    
    // 保存数据并跳转到下一页
    const data = {
      ...this.data.previousPageData, // 包含上一页的数据
      thicknessItems: this.data.items
    };
    
    wx.navigateTo({
      url: '/pages/special/special',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  }
}) 