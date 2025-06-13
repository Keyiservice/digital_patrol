Component({
  /**
   * 组件的属性列表
   */
  properties: {
    
  },

  /**
   * 组件的初始数据
   */
  data: {
    isLogin: false,
    userName: ''
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached: function() {
      this.checkLoginStatus();
    },
    
    // 组件在页面显示时更新登录状态
    show: function() {
      this.checkLoginStatus();
    }
  },
  
  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show: function() {
      this.checkLoginStatus();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 检查登录状态
    checkLoginStatus: function() {
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
    }
  }
}) 