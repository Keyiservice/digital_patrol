// main-patrol.js
// 引入时间格式化工具
const util = require('../../utils/util.js');

Page({
  data: {
    scanCompleted: false, // 用于控制是否显示扫码界面
    inspectionTime: '', // 巡检时间
    deviceId: '', // 设备ID
    deviceName: '', // 设备名称
    inspectionItems: [],
    
    // 用于存储当前巡检计划
    currentPlan: null,
    scrollHeight: 0 // 新增：用于存储滚动区域的高度
  },

  onLoad() {
    // 页面加载时，默认准备扫码
    this.setData({
      scanCompleted: false,
      inspectionTime: util.formatTime(new Date())
    });
  },

  // 返回上一页（用于扫描页的返回按钮）
  goBack() {
    wx.navigateBack();
  },

  // 根据设备ID加载巡检计划
  loadInspectionPlan(deviceId) {
    wx.showLoading({ title: '加载巡检计划...' });

        wx.cloud.callFunction({
      name: 'getMainInspectionPlan',
      data: { deviceId },
      success: res => {
        if (res.result.success) {
          const plan = res.result.data;
          const items = plan.inspectionItems[plan.inspectionAreas[0]] || [];
          const formattedItems = items.map(item => ({
            ...item,
            isAbnormal: false,
            abnormalDesc: '',
            imageUrl: ''
          }));

              this.setData({
            deviceId: plan.deviceId,
            deviceName: plan.deviceName,
            currentPlan: plan,
            inspectionTime: util.formatTime(new Date()),
            inspectionItems: formattedItems,
            scanCompleted: true
          }, () => {
            // 关键：在页面渲染完成后，计算滚动区域高度
            this.calculateScrollViewHeight();
          });

            } else {
              wx.showModal({
                title: '获取失败',
            content: res.result.message || '未找到该设备的巡检计划',
            showCancel: false,
            success: () => wx.navigateBack() // 获取失败后点确定返回
              });
            }
          },
      fail: () => {
        wx.showToast({ title: '加载计划失败', icon: 'error' });
      },
      complete: () => {
            wx.hideLoading();
          }
        });
      },

  // 新增：计算滚动区域高度的函数
  calculateScrollViewHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;

    const query = wx.createSelectorQuery();
    query.select('#inspection-header').boundingClientRect();
    query.select('#bottom-section').boundingClientRect();
    query.exec(res => {
      if (res && res[0] && res[1]) {
        const topHeight = res[0].height;
        const bottomHeight = res[1].height;
        const scrollHeight = windowHeight - topHeight - bottomHeight;
        
        this.setData({
          scrollHeight: scrollHeight
        });
      }
    });
  },

  // 扫描二维码
  scanQRCode() {
    wx.scanCode({
      success: res => {
        const rawId = res.result.trim();
        const numericId = parseInt(rawId);
        
        if (!isNaN(numericId)) {
          this.loadInspectionPlan(numericId.toString());
        } else {
          wx.showToast({ title: '无效的设备码', icon: 'error' });
        }
      },
      fail: () => {
        wx.showToast({ title: '扫码失败', icon: 'none' });
      }
    });
  },

  // 结果变化（OK/NG）
  onResultChange(e) {
    const id = e.currentTarget.dataset.id;
    const isAbnormal = e.detail.value === 'NG';
    
    const index = this.data.inspectionItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.setData({
        [`inspectionItems[${index}].isAbnormal`]: isAbnormal
      });
    }
  },

  // 异常描述输入
  onAbnormalInput(e) {
    const id = e.currentTarget.dataset.id;
    const abnormalDesc = e.detail.value;
    
    const index = this.data.inspectionItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.setData({
        [`inspectionItems[${index}].abnormalDesc`]: abnormalDesc
      });
    }
  },

  // 为指定巡检项选择图片
  chooseImage(e) {
    const { id } = e.currentTarget.dataset;
    const index = this.data.inspectionItems.findIndex(item => item.id === id);

    if (index === -1) return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
          this.setData({
          [`inspectionItems[${index}].imageUrl`]: tempFilePath
          });
        // 这里可以接上传逻辑
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
    wx.previewImage({
      urls: [url]
      });
    }
  },

  // 取消按钮
  onCancel() {
    wx.showModal({
      title: '确认退出',
      content: '所有未保存的数据将会丢失，确定要返回吗？',
      success: res => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 提交按钮
  onSubmit() {
    // 检查异常项是否填写了描述
    for (const item of this.data.inspectionItems) {
      if (item.isAbnormal && !item.abnormalDesc) {
        wx.showToast({ title: '请填写所有异常项的描述', icon: 'none' });
        return;
      }
    }
    
    // 准备要保存的数据
    const userInfo = wx.getStorageSync('userInfo') || {};
    const record = {
      deviceId: this.data.deviceId,
      deviceName: this.data.deviceName,
      inspector: userInfo.accountName || '未知巡检员',
      inspectionTime: this.data.inspectionTime, // 保存开始巡检时的时间
      items: this.data.inspectionItems,
      completedTime: util.formatTime(new Date())
    };
    
    wx.showLoading({ title: '保存中...' });
    
    wx.cloud.callFunction({
      name: 'saveMainPatrolRecord',
      data: { record },
      success: res => {
        if (res.result.success) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.result.message || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'error' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
}); 