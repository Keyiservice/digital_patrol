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
    projects: [], // 初始化为空数组
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
    
    // **新增**：加载动态项目列表
    this.loadProjectOptions();

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
   * **新增**：加载项目选项的方法
   */
  loadProjectOptions: function() {
    wx.showLoading({ title: '加载项目...' });
    try {
      wx.cloud.callFunction({
        name: 'getProjectOptions',
        success: res => {
          if (res.result && res.result.success) {
            this.setData({
              projects: res.result.data
            });
          } else {
            wx.showToast({
              title: res.result.message || '项目加载失败',
              icon: 'none'
            });
          }
        },
        fail: err => {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          console.error("获取项目列表失败: ", err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } catch (e) {
      console.error("调用云函数时发生错误: ", e);
      wx.hideLoading(); // 在同步错误时也确保关闭loading
      wx.showToast({
        title: '系统错误',
        icon: 'none'
      });
    }
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
      projectIndex: e.detail.value,
      projectSelected: this.data.projects[e.detail.value]
    });
  },

  /**
   * 处理流程选择变化
   */
  onProcessChange: function(e) {
    this.setData({
      processIndex: e.detail.value,
      processSelected: this.data.processes[e.detail.value]
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
    if (this.data.projectIndex === null) {
      wx.showToast({
        title: '请选择项目',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (this.data.processIndex === null) {
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

  goToList: function() {
    wx.navigateTo({
      url: '/pages/qua-patrol-list/qua-patrol-list',
      fail: err => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
        console.error("跳转失败: ", err);
      }
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
      projectSelected: this.data.projects[this.data.projectIndex],
      processSelected: this.data.processes[this.data.processIndex],
      shiftSelected: this.data.shiftSelected
    };
    
    console.log('跳转到cookie_number页面，传递数据:', data);
    
    // 先跳转到cookie_number页面
    wx.navigateTo({
      url: '/pages/cookie_number/cookie_number',
      success: function(res) {
        // 传递数据给cookie_number页面
        res.eventChannel.emit('acceptDataFromPreviousPage', { data: data });
      },
      fail: function(err) {
        console.error('跳转到cookie_number页面失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
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
    // 这个函数不再直接使用，改用onNext函数跳转到cookie_number页面
    // 保留这个函数作为后备

    const { projectIndex, processIndex, projects, processes } = this.data;

    if (projectIndex === null || processIndex === null) {
      wx.showToast({ title: '请选择项目和过程', icon: 'none' });
      return;
    }

    const selectedProject = this.data.projectSelected || projects[projectIndex];
    const selectedProcess = this.data.processSelected || processes[processIndex];

    // 在调用云函数前显示加载提示
    wx.showLoading({ title: '加载巡检项...' });
    let loadingShown = true; // 用于跟踪loading状态
    
    try {
      wx.cloud.callFunction({
        name: 'getQuaInspectionPlan',
        data: {
          project: selectedProject,
          process: selectedProcess
        },
        success: res => {
          if (res.result && res.result.success && res.result.data.length > 0) {
            // 处理返回的巡检项数据
            const items = res.result.data.map(item => ({
              id: item.id,
              name: item.name,
              isAbnormal: false,
              abnormalDesc: '',
              imageUrl: ''
            }));
            
            this.setData({
              inspectionStarted: true,
              inspectionStartTime: util.formatTime(new Date()),
              inspectionItems: items
            });
          } else {
            // 显示错误消息
            wx.hideLoading(); // 先隐藏loading
            loadingShown = false;
            wx.showToast({ 
              title: res.result ? (res.result.message || '未找到计划') : '未能获取巡检项', 
              icon: 'none' 
            });
          }
        },
        fail: err => {
          console.error('获取巡检计划失败:', err);
          // 发生错误时确保隐藏loading
          if (loadingShown) {
            wx.hideLoading();
            loadingShown = false;
          }
          wx.showToast({ title: '加载失败，请重试', icon: 'none' });
        },
        complete: () => {
          // 仅当loading仍然显示时才隐藏它
          if (loadingShown) {
            wx.hideLoading();
          }
        }
      });
    } catch (error) {
      console.error('云函数调用异常:', error);
      // 确保在异常情况下也能隐藏loading
      if (loadingShown) {
        wx.hideLoading();
      }
      wx.showToast({ title: '系统错误，请重试', icon: 'none' });
    }
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
        
        // 在上传前显示loading
        wx.showLoading({ title: '上传中...' });
        let loadingShown = true; // 跟踪loading状态
        
        try {
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
            fail: err => {
              console.error('文件上传失败:', err);
              // 失败时确保隐藏loading
              if (loadingShown) {
                wx.hideLoading();
                loadingShown = false;
              }
              wx.showToast({ title: '上传失败，请重试', icon: 'none' });
            },
            complete: () => {
              // 仅当loading仍然显示时才隐藏它
              if (loadingShown) {
                wx.hideLoading();
              }
            }
          });
        } catch (error) {
          console.error('文件上传异常:', error);
          // 确保在异常情况下也能隐藏loading
          if (loadingShown) {
            wx.hideLoading();
          }
          wx.showToast({ title: '上传出错，请重试', icon: 'none' });
        }
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
      items: this.data.inspectionItems.map(item => ({
        id: item.id,
        name: item.name,
        isAbnormal: item.isAbnormal,
        abnormalDesc: item.abnormalDesc,
        imageUrl: item.imageUrl
      }))
    };

    // 在提交前显示loading
    wx.showLoading({ title: '正在保存...' });
    let loadingShown = true; // 跟踪loading状态
    
    try {
      wx.cloud.callFunction({
        name: 'saveQuaPatrolRecord',
        data: {
          record: submitData
        },
        success: res => {
          if (res.result && res.result.success) {
            // 成功时隐藏loading
            if (loadingShown) {
              wx.hideLoading();
              loadingShown = false;
            }
            
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
            // 失败时隐藏loading并显示错误
            if (loadingShown) {
              wx.hideLoading();
              loadingShown = false;
            }
            wx.showToast({ title: res.result?.message || '保存失败', icon: 'none' });
          }
        },
        fail: err => {
          console.error('保存巡检记录失败:', err);
          // 失败时确保隐藏loading
          if (loadingShown) {
            wx.hideLoading();
            loadingShown = false;
          }
          wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        },
        complete: () => {
          // 仅当loading仍然显示时才隐藏它
          if (loadingShown) {
            wx.hideLoading();
          }
        }
      });
    } catch (error) {
      console.error('提交数据异常:', error);
      // 确保在异常情况下也能隐藏loading
      if (loadingShown) {
        wx.hideLoading();
      }
      wx.showToast({ title: '系统错误，请重试', icon: 'none' });
    }
  }
})