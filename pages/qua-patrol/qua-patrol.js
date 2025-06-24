// pages/qua-patrol/qua-patrol.js
const util = require('../../utils/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin: false,
    userName: '',
    projectSelected: '', // 选择的项目
    processSelected: '', // 选择的流程
    shiftSelected: '',   // 选择的班次
    items: [
      {
        id: 1,
        description: '', // 这里后续动态赋值
        result: '',
        photos: []
      }
    ],
    previousPageData: null, // 存储上一页传递的数据
    currentDate: '', // 当前日期
    currentTime: '',  // 当前时间
    // 阶段控制
    inspectionStarted: false,

    // 阶段一：选择数据
    projects: ['G68', 'P71A'],
    projectIndex: null,
    processes: ['BMM', 'FC', 'ASM'],
    processIndex: null,
    
    // 阶段二：巡检数据
    inspectionStartTime: '',
    inspectionItems: [],
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
    try {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('acceptDataFromPreviousPage', (data) => {
        console.log('接收到上一页数据:', data);
        this.setData({
          previousPageData: data.data || {}
        });
      });
    } catch (error) {
      console.error('获取上一页数据失败:', error);
      this.setData({
        previousPageData: {}
      });
    }
    this.updateDateTime();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 再次检查登录状态
    const app = getApp();
    app.checkLoginStatus();
    this.updateDateTime();
  },

  /**
   * 处理项目选择变化
   */
  onProjectChange: function(e) {
    this.setData({
      projectIndex: e.detail.value
    });
  },

  /**
   * 处理流程选择变化
   */
  onProcessChange: function(e) {
    this.setData({
      processIndex: e.detail.value
    });
  },

  /**
   * 处理班次选择变化
   */
  onShiftChange: function(e) {
    this.setData({
      shiftSelected: e.detail.value
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
    if (!this.data.projectSelected) {
      wx.showToast({
        title: '请选择项目',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.processSelected) {
      wx.showToast({
        title: '请选择流程',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.shiftSelected) {
      wx.showToast({
        title: '请选择班次',
        icon: 'none',
        duration: 2000
      });
      return false;
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
    
    // 保存选择数据
    const data = {
      ...this.data.previousPageData, // 包含上一页的数据
      projectSelected: this.data.projectSelected,
      processSelected: this.data.processSelected,
      shiftSelected: this.data.shiftSelected
    };
    
    // 根据选择的流程决定跳转路径
    let nextPage = '';
    
    switch (this.data.processSelected) {
      case 'BMM':
        nextPage = '/pages/appearance_first/appearance_first';
        break;
      case 'FC':
        nextPage = '/pages/fc/fc';
        break;
      case 'ASM':
        nextPage = '/pages/asm/asm';
        break;
      default:
        wx.showToast({
          title: '请选择有效的流程',
          icon: 'none',
          duration: 2000
        });
        return;
    }
    
    wx.navigateTo({
      url: nextPage,
      success: function(res) {
        // 传递数据给下一页
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      }
    });
  },

  /**
   * 更新时间方法
   */
  updateDateTime: function() {
    const now = new Date();
    const pad = n => n < 10 ? '0' + n : n;
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    this.setData({
      currentDate: date,
      currentTime: time,
      'items[0].description': `日期：${date}  时间：${time}`
    });
  },

  startInspection: function() {
    const { projectIndex, processIndex, projects, processes } = this.data;

    if (projectIndex === null || processIndex === null) {
      wx.showToast({ title: '请选择项目和过程', icon: 'none' });
      return;
    }

    const selectedProject = projects[projectIndex];
    const selectedProcess = processes[processIndex];

    wx.showLoading({ title: '加载巡检项...' });
    
    wx.cloud.callFunction({
      name: 'getQuaInspectionPlan',
      data: {
        project: selectedProject,
        process: selectedProcess
      },
      success: res => {
        if (res.result && res.result.success && res.result.data.length > 0) {
          const items = res.result.data.map(item => ({...item, isAbnormal: false, abnormalDesc: '', imageUrl: ''}));
          this.setData({
            inspectionStarted: true,
            inspectionStartTime: util.formatTime(new Date()),
            inspectionItems: items
          });
        } else {
          wx.showToast({ title: res.result.message || '未找到计划', icon: 'none' });
        }
      },
      fail: err => {
        wx.showToast({ title: '加载失败，请重试', icon: 'none' });
        console.error(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  onAbnormalInput: function(e) {
    const { id } = e.currentTarget.dataset;
    const value = e.detail.value;
    const itemIndex = this.data.inspectionItems.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      this.setData({
        [`inspectionItems[${itemIndex}].abnormalDesc`]: value
      });
    }
  },

  chooseImage: function(e) {
    const { id } = e.currentTarget.dataset;
    const itemIndex = this.data.inspectionItems.findIndex(item => item.id === id);

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        const cloudPath = `qua-patrol-images/${Date.now()}-${Math.floor(Math.random() * 1000)}${tempFilePath.match(/\.\w+$/)[0]}`;
        
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: uploadRes => {
            if (itemIndex > -1) {
              this.setData({
                [`inspectionItems[${itemIndex}].imageUrl`]: uploadRes.fileID
              });
            }
          },
          fail: console.error,
          complete: () => {
            wx.hideLoading();
          }
        });
      }
    });
  },

  onCancel: function() {
    wx.showModal({
      title: '确认退出',
      content: '所有未保存的数据都将丢失，确定吗？',
      success: res => {
        if (res.confirm) {
          this.setData({
            inspectionStarted: false,
            projectIndex: null,
            processIndex: null,
            inspectionItems: []
          });
        }
      }
    });
  },

  onSubmit: function() {
    let abnormalDescMissing = false;
    this.data.inspectionItems.forEach(item => {
      if (item.isAbnormal && !item.abnormalDesc.trim()) {
        abnormalDescMissing = true;
      }
    });

    if (abnormalDescMissing) {
      wx.showToast({ title: '请为NG项填写异常描述', icon: 'none' });
      return;
    }

    const submitData = {
      project: this.data.projects[this.data.projectIndex],
      process: this.data.processes[this.data.processIndex],
      inspectionTime: this.data.inspectionStartTime,
      inspector: wx.getStorageSync('userInfo')?.accountName || '未知用户',
      items: this.data.inspectionItems
    };

    wx.showLoading({ title: '正在保存...' });

    wx.cloud.callFunction({
      name: 'saveQuaPatrolRecord',
      data: {
        record: submitData
      },
      success: res => {
        if (res.result && res.result.success) {
          wx.showModal({
            title: '保存成功',
            content: '质量巡检记录已保存。',
            showCancel: false,
            success: () => {
              this.setData({
                inspectionStarted: false,
                projectIndex: null,
                processIndex: null,
                inspectionItems: []
              });
            }
          });
        } else {
          wx.showToast({ title: res.result.message || '保存失败', icon: 'none' });
        }
      },
      fail: err => {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        console.error(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 模拟数据函数
  getMockInspectionItems(project, process) {
    // 实际应从数据库获取，这里只做演示
    const baseItems = [
      { id: 1, name: '外观是否有划痕、凹陷', isAbnormal: false, abnormalDesc: '', imageUrl: ''},
      { id: 2, name: '标签是否粘贴正确、清晰', isAbnormal: false, abnormalDesc: '', imageUrl: ''},
      { id: 3, name: '产品结合处是否对齐、有毛刺', isAbnormal: false, abnormalDesc: '', imageUrl: ''}
    ];
    // 可以根据 project 和 process 返回不同的检查项
    if (project === 'P71A') {
      baseItems.push({ id: 4, name: 'P71A专属检查项：特殊卡扣是否到位', isAbnormal: false, abnormalDesc: '', imageUrl: ''});
    }
    if (process === 'ASM') {
      baseItems.push({ id: 5, name: 'ASM过程专属：螺丝扭矩是否达标', isAbnormal: false, abnormalDesc: '', imageUrl: ''});
    }
    return baseItems;
  }
})