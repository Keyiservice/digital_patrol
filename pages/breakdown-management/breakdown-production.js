const util = require('../../utils/util.js');

Page({
  data: {
    // 新增 mode 字段
    mode: 'add', // 'add' or 'view'
    recordId: null,
    // 设备类型选项
    deviceTypeOptions: ['UTILITY', 'BMM', 'FC', 'ASM'],
    deviceTypeIndex: 0,
    // 项目名称选项
    projectOptions: ['G68', 'P71A', 'P171', 'E371'],
    projectIndex: 0,
    // 班次选项
    shiftOptions: ['Day shift', 'Night shift'],
    shiftIndex: 0,
    // 报修日期和时间
    reportDate: '',
    reportTime: '',
    // 故障描述
    faultDescription: '',
    // 报修人员（登录人）
    reporter: '',
    // 保存状态
    isSaving: false
  },

  onLoad(options) {
    if (options.id) {
      // 如果有 id，说明是查看模式
      this.setData({
        mode: options.mode || 'view',
        recordId: options.id
      });
      this.loadRecord(options.id);
      wx.setNavigationBarTitle({ title: '查看生产报修' });
    } else {
      // 否则是新增模式
      this.setData({ mode: 'add' });
      // 初始化日期和时间
      const now = new Date();
      const reportDate = util.formatDate(now);
      const reportTime = util.formatTime(now).substring(11, 16);
      // 获取登录用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        reportDate,
        reportTime,
        reporter: userInfo.accountName || ''
      });
      wx.setNavigationBarTitle({ title: '新建生产报修' });
    }
  },

  // 新增加载记录函数
  loadRecord(id) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getBreakdownRecord',
      data: { id: id },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const record = res.result.data;
          this.setData({
            deviceTypeIndex: this.data.deviceTypeOptions.indexOf(record.deviceType),
            projectIndex: this.data.projectOptions.indexOf(record.project),
            shiftIndex: this.data.shiftOptions.indexOf(record.shift),
            reportDate: record.reportDate,
            reportTime: record.reportTime,
            faultDescription: record.faultDescription,
            reporter: record.reporter
          });
        } else {
          wx.showToast({ title: '记录加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },

  // 设备类型选择变更
  onDeviceTypeChange(e) {
    this.setData({
      deviceTypeIndex: e.detail.value
    });
  },

  // 项目选择变更
  onProjectChange(e) {
    this.setData({
      projectIndex: e.detail.value
    });
  },

  // 班次选择变更
  onShiftChange(e) {
    this.setData({
      shiftIndex: e.detail.value
    });
  },

  // 故障描述输入
  onFaultDescriptionInput(e) {
    this.setData({
      faultDescription: e.detail.value
    });
  },

  // 保存报修记录
  async onSave() {
    if (this.data.isSaving) return;
    
    // 表单验证
    if (!this.data.faultDescription) {
      wx.showToast({
        title: '请输入故障现象描述',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.reporter) {
      wx.showToast({
        title: '未获取到保修人员信息',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSaving: true });
    wx.showLoading({ title: '提交中...' });
    
    try {
      // 准备数据
      const recordData = {
        deviceType: this.data.deviceTypeOptions[this.data.deviceTypeIndex],
        project: this.data.projectOptions[this.data.projectIndex],
        shift: this.data.shiftOptions[this.data.shiftIndex],
        reportDate: this.data.reportDate,
        reportTime: this.data.reportTime,
        faultDescription: this.data.faultDescription,
        reporter: this.data.reporter,
        status: 'pending', // 待维修状态
        createTime: new Date().toISOString()
      };
      
      // 调用云函数保存记录
      const res = await wx.cloud.callFunction({
        name: 'saveBreakdownRecord',
        data: recordData
      });
      
      wx.hideLoading();
      
      if (res && res.result && res.result.success) {
        wx.showToast({
          title: '报修提交成功',
          icon: 'success'
        });
        
        // 跳转回列表页
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      } else {
        // 云函数调用失败，保存到本地
        this.saveToLocal(recordData);
      }
    } catch (err) {
      console.error('保存报修记录失败:', err);
      wx.hideLoading();
      
      // 创建一个临时记录对象用于本地保存
      const localRecord = {
        deviceType: this.data.deviceTypeOptions[this.data.deviceTypeIndex],
        project: this.data.projectOptions[this.data.projectIndex],
        shift: this.data.shiftOptions[this.data.shiftIndex],
        reportDate: this.data.reportDate,
        reportTime: this.data.reportTime,
        faultDescription: this.data.faultDescription,
        reporter: this.data.reporter,
        status: 'pending',
        createTime: new Date().toISOString()
      };
      
      // 失败时保存到本地
      this.saveToLocal(localRecord);
    } finally {
      this.setData({ isSaving: false });
    }
  },
  
  // 保存到本地
  saveToLocal(record) {
    try {
      if (!record) {
        console.error('无效的记录数据');
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
        return;
      }
      
      // 添加本地ID标识
      record.id = 'local_' + Date.now();
      
      const localRecords = wx.getStorageSync('breakdownRecords') || [];
      localRecords.push(record);
      wx.setStorageSync('breakdownRecords', localRecords);
      
      wx.showToast({
        title: '已保存到本地',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (err) {
      console.error('本地保存失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },
  
  // 取消报修
  onCancel() {
    wx.navigateBack({ delta: 1 });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
}); 