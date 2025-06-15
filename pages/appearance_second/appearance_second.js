// pages/appearance_second/appearance_second.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    items: [
      {
        id: 3,
        description: '吹针入口均匀；密封面无划痕,无凹陷,无气泡,无凸起,主泵口E-Ring完全包裹、后墙无空洞、气泡',
        result: '',
        photos: []
      },
      {
        id: 4,
        description: '合模线外观无开口、露白；合模线起始位置和终止位置正确',
        result: '',
        photos: []
      }
    ],
    previousPageData: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取上一页传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromPreviousPage', (data) => {
      this.setData({
        previousPageData: data.data
      });
    });
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

  takePhoto(e) {
    const { itemIndex } = e.currentTarget.dataset;
    const { items } = this.data;
    const currentPhotos = items[itemIndex].photos || [];

    wx.chooseImage({
      count: 5 - currentPhotos.length, // 最多选择5张，减去已有的照片数
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newPhotos = currentPhotos.concat(tempFilePaths);
        items[itemIndex].photos = newPhotos.slice(0, 5); // 确保不超过5张
        this.setData({ items });
      }
    });
  },

  previewImage(e) {
    const { itemIndex, photoIndex } = e.currentTarget.dataset;
    const { items } = this.data;
    const current = items[itemIndex].photos[photoIndex];
    const urls = items[itemIndex].photos; // 预览所有照片
    wx.previewImage({
      current: current,
      urls: urls
    });
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
    
    // 合并数据并跳转到下一页
    const combinedData = {
      ...this.data.previousPageData,
      // 这里可以将当前页的检查结果合并到 combinedData 中，具体取决于数据结构和后续页面的需求
      appearanceSecondItems: this.data.items
    };
    
    wx.navigateTo({
      url: '/pages/thickness/thickness',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: combinedData });
      }
    });
  }
}) 