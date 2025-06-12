Page({
  data: {
    tNumber: '',
    cookieNumber: ''
  },

  onLoad: function () {
    // 页面加载时的逻辑
  },

  onTNumberInput: function (e) {
    this.setData({
      tNumber: e.detail.value
    });
  },

  onCookieNumberInput: function (e) {
    this.setData({
      cookieNumber: e.detail.value
    });
  },

  onPrevious: function () {
    console.log('点击了 PREVIOUS 按钮');
    // 可以在这里添加返回上一页的逻辑
    wx.navigateBack();
  },

  onNext: function () {
    console.log('点击了 NEXT 按钮');
    // 可以在这里添加跳转到下一页或提交数据的逻辑
    // 例如：wx.navigateTo({ url: '/pages/next-page/next-page' });
  }
}); 