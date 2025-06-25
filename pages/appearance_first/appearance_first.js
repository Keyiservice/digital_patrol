// pages/appearance_first/appearance_first.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin: false,
    userName: '',
    items: [],
    previousPageData: null, // 存储上一页传递的数据
    loading: false, // 加载状态
    tNumber: '',  // T-Number
    cookieNumber: '' // Cookie Number
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取上一页传递的参数
    try {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('acceptDataFromPreviousPage', (data) => {
        console.log('接收到上一页数据:', data);
        
        const prevData = data.data || {};
        this.setData({
          previousPageData: prevData,
          tNumber: prevData.tNumber || '',
          cookieNumber: prevData.cookieNumber || ''
        });
        
        // 加载巡检项目
        this.loadInspectionItems(prevData.projectSelected, prevData.processSelected);
      });
    } catch (error) {
      console.error('获取上一页数据失败:', error);
      this.setData({
        previousPageData: {},
        tNumber: '',
        cookieNumber: ''
      });
    }
  },
  
  /**
   * 加载巡检项目
   */
  loadInspectionItems: function(project, process) {
    if (!project || !process) {
      wx.showToast({
        title: '缺少项目或流程参数',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    wx.showLoading({ title: '加载检查项...' });
    let loadingShown = true;
    
    try {
      wx.cloud.callFunction({
        name: 'getQuaInspectionPlan',
        data: {
          project: project,
          process: process
        },
        success: res => {
          if (res.result && res.result.success && res.result.data.length > 0) {
            // 检查项目过多时，分为多个页面
            const allItems = res.result.data.map(item => ({
              id: item.id,
              description: item.name,
              result: '',
              photos: []
            }));
            
            // 取前2项显示在第一页
            const firstPageItems = allItems.slice(0, 2);
            
            this.setData({
              items: firstPageItems,
              allItems: allItems
            });
          } else {
            if (loadingShown) {
              wx.hideLoading();
              loadingShown = false;
            }
            wx.showToast({ 
              title: res.result ? (res.result.message || '未找到检查项') : '加载检查项失败', 
              icon: 'none' 
            });
          }
        },
        fail: err => {
          console.error('获取巡检计划失败:', err);
          if (loadingShown) {
            wx.hideLoading();
            loadingShown = false;
          }
          wx.showToast({ title: '加载失败，请重试', icon: 'none' });
        },
        complete: () => {
          this.setData({ loading: false });
          if (loadingShown) {
            wx.hideLoading();
          }
        }
      });
    } catch (error) {
      console.error('云函数调用异常:', error);
      this.setData({ loading: false });
      if (loadingShown) {
        wx.hideLoading();
      }
      wx.showToast({ title: '系统错误，请重试', icon: 'none' });
    }
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 不检查登录状态
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
  
  /**
   * 预览图片
   */
  previewImage: function(e) {
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
    
    // 保存数据并跳转到下一页
    const data = {
      ...this.data.previousPageData, // 包含上一页的数据
      appearanceFirstItems: this.data.items,
      allItems: this.data.allItems // 传递所有检查项
    };
    
    wx.navigateTo({
      url: '/pages/appearance_second/appearance_second',
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  }
}) 