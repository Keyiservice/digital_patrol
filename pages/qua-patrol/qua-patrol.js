// qua-patrol.js
Page({
  data: {
    // 项目列表
    projectList: ['项目A', '项目B', '项目C', '项目D'],
    projectIndex: -1,
    
    // 流程列表
    processList: ['流程1', '流程2', '流程3', '流程4'],
    processIndex: -1,
    
    // 班次列表
    shiftList: ['白班', '夜班', '中班'],
    shiftIndex: -1,
    
    // 日期时间
    currentDate: '',
    currentTime: '',
    displayDate: '',
    displayTime: '',
    timerId: null, // 添加 timerId 用于存储定时器ID
  },

  onLoad() {
    console.log('QUA ONLINE PATROL 页面加载');
    this.initDateTime();
    // 启动定时器，每秒更新日期和时间
    this.data.timerId = setInterval(() => {
      this.initDateTime();
    }, 1000);
  },

  // 初始化日期时间
  initDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    this.setData({
      currentDate: `${year}-${month}-${day}`,
      currentTime: `${hours}:${minutes}`,
      displayDate: `${year}-${month}-${day}`, // 始终显示精确日期
      displayTime: `${hours}:${minutes}`      // 始终显示精确时间
    });
  },

  // 项目选择
  onProjectChange(e) {
    console.log('选择项目:', this.data.projectList[e.detail.value]);
    this.setData({
      projectIndex: e.detail.value
    });
  },

  // 流程选择
  onProcessChange(e) {
    console.log('选择流程:', this.data.processList[e.detail.value]);
    this.setData({
      processIndex: e.detail.value
    });
  },

  // 日期选择
  onDateChange(e) {
    console.log('选择日期:', e.detail.value);
    // 移除判断是否为今天的逻辑，始终显示选择的日期
    this.setData({
      currentDate: e.detail.value,
      displayDate: e.detail.value
    });
  },

  // 时间选择
  onTimeChange(e) {
    console.log('选择时间:', e.detail.value);
    // 移除判断是否为当前时间的逻辑，始终显示选择的时间
    this.setData({
      currentTime: e.detail.value,
      displayTime: e.detail.value
    });
  },

  // 班次选择
  onShiftChange(e) {
    console.log('选择班次:', this.data.shiftList[e.detail.value]);
    this.setData({
      shiftIndex: e.detail.value
    });
  },

  // 时间转换为分钟数（用于比较）
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // 下一步按钮
  onNext() {
    // 验证表单
    if (this.data.projectIndex === -1) {
      wx.showToast({
        title: '请选择项目',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.processIndex === -1) {
      wx.showToast({
        title: '请选择流程',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.shiftIndex === -1) {
      wx.showToast({
        title: '请选择班次',
        icon: 'none'
      });
      return;
    }

    // 收集表单数据
    const formData = {
      project: this.data.projectList[this.data.projectIndex],
      process: this.data.processList[this.data.processIndex],
      date: this.data.currentDate,
      time: this.data.currentTime,
      shift: this.data.shiftList[this.data.shiftIndex]
    };

    console.log('表单数据:', formData);

    // 显示成功提示
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000
    });

    // 这里可以添加跳转到下一个页面的逻辑
    // wx.navigateTo({
    //   url: '/pages/patrol-detail/patrol-detail?data=' + JSON.stringify(formData)
    // });
    
    // 或者返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 2000);
  },

  onShow() {
    // 页面显示时，如果定时器未启动，则重新启动，并更新时间
    if (!this.data.timerId) {
      this.initDateTime();
      this.data.timerId = setInterval(() => {
        this.initDateTime();
      }, 1000);
    }
  },

  onReady() {
    // 页面初次渲染完成
  },

  onHide() {
    // 页面隐藏时，清除定时器
    if (this.data.timerId) {
      clearInterval(this.data.timerId);
      this.data.timerId = null;
    }
  },

  onUnload() {
    // 页面卸载时，清除定时器
    if (this.data.timerId) {
      clearInterval(this.data.timerId);
      this.data.timerId = null;
    }
  }
});