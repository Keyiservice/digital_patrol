// pages/fc/fc.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    items: [
      { id: 1, description: 'SOLDER DEFECT', result: '', photos: [] },
      { id: 2, description: 'MISSING COMPONENT', result: '', photos: [] },
      { id: 3, description: 'WRONG COMPONENT', result: '', photos: [] }
    ],
    previousPageData: null, // 存储上一页传递的数据
    currentDate: '', // 当前日期
    currentTime: ''  // 当前时间
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let previousPageData = {};
    try {
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.on === 'function') {
        eventChannel.on('acceptDataFromPreviousPage', (data) => {
          previousPageData = data.data || {};
          this.setData({
            previousPageData
          });
        });
      } else {
        this.setData({
          previousPageData
        });
      }
    } catch (e) {
      this.setData({
        previousPageData
      });
    }
  },

  /**
   * 处理单选按钮变化
   */
  onResultChange(e) {
    const { itemIndex } = e.currentTarget.dataset;
    const value = e.detail.value;
    const { items } = this.data;
    items[itemIndex].result = value;
    this.setData({ items });
  },

  /**
   * 拍照功能
   */
  takePhoto: function(e) {
    const { itemIndex } = e.currentTarget.dataset;
    const { items } = this.data;
    const currentPhotos = items[itemIndex].photos || [];

    wx.chooseImage({
      count: 5 - currentPhotos.length, // 最多5张
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newPhotos = currentPhotos.concat(tempFilePaths);
        items[itemIndex].photos = newPhotos.slice(0, 5);
        this.setData({ items });
      }
    });
  },

  /**
   * 预览图片
   */
  previewImage: function(e) {
    const { itemIndex, photoIndex } = e.currentTarget.dataset;
    const { items } = this.data;
    const current = items[itemIndex].photos[photoIndex];
    const urls = items[itemIndex].photos;
    wx.previewImage({ current, urls });
  },

  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    for (let i = 0; i < this.data.items.length; i++) {
      if (!this.data.items[i].result) {
        wx.showToast({
          title: `请选择第${i + 1}项检查结果`,
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
    wx.navigateBack({ delta: 1 });
  },

  /**
   * 处理下一页按钮点击
   */
  onNext: function() {
    if (!this.validateForm()) return;

    const data = {
      ...this.data.previousPageData,
      fcItems: this.data.items
    };

    wx.navigateTo({
      url: '/pages/asm/asm',
      success: function(res) {
        res.eventChannel.emit('acceptDataFromPreviousPage', { data });
      }
    });
  }
}); 