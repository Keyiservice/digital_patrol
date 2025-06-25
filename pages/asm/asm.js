// pages/asm/asm.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    items: [],
    previousPageData: null, // 存储上一页传递的数据
    processType: '', // FC 或 ASM
    currentStep: 1,    // 当前是第几步
    currentDate: '', // 当前日期
    currentTime: '',  // 当前时间
    loading: false, // 加载状态
    tNumber: '',  // T-Number
    cookieNumber: '' // Cookie Number
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    try {
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.on === 'function') {
        eventChannel.on('acceptDataFromPreviousPage', (data) => {
          const prevData = data.data || {};
          // 更新数据
          this.setData({
            previousPageData: prevData,
            tNumber: prevData.tNumber || '',
            cookieNumber: prevData.cookieNumber || '',
            processType: 'ASM',
            currentStep: 1
          });
          
          // 设置标题
          wx.setNavigationBarTitle({
            title: 'ASM CHECK'
          });
          
          // 加载巡检项目
          this.loadInspectionItems(prevData.projectSelected, prevData.processSelected);
        });
      } else {
        console.warn('无法获取上一页传递的数据通道');
        this.setData({
          previousPageData: {},
          tNumber: '',
          cookieNumber: '',
          processType: 'ASM',
          currentStep: 1
        });
      }
    } catch (e) {
      console.error('获取上一页数据失败:', e);
      this.setData({
        previousPageData: {},
        tNumber: '',
        cookieNumber: '',
        processType: 'ASM',
        currentStep: 1
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
            // 将巡检项转换为页面需要的格式
            const asmItems = res.result.data.map(item => ({
              id: item.id,
              description: item.name,
              result: '',
              photos: []
            }));
            
            this.setData({
              items: asmItems
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
      count: 5 - currentPhotos.length,
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
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 处理下一页按钮点击
   */
  onNext: function() {
    if (!this.validateForm()) return;

    const data = {
      ...this.data.previousPageData,
      asmItems: this.data.items
    };

    // 直接跳转到总结页面
    wx.navigateTo({
      url: '/pages/summary/summary',
      success: function(res) {
        res.eventChannel.emit('acceptDataFromPreviousPage', { data });
      }
    });
  }
}); 