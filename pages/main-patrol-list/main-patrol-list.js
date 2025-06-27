const util = require('../../utils/util.js');

Page({
  data: {
    records: [],
    isLoading: false,
    
    // 筛选条件
    startDate: '',
    endDate: '',
    deviceId: '',
    deviceOptions: [],
    deviceIndex: 0,
    
    // 是否只显示昨天的记录
    showYesterdayOnly: true,
    hasFiltered: false // 新增：用于标记是否进行过筛选
  },

  onLoad() {
    // 默认设置日期为昨天
    this.setYesterdayDate();
    // 获取设备列表
    this.getDeviceOptions();
  },

  onShow() {
    // 页面显示时，如果没有进行过筛选，则加载默认数据
    if (!this.data.hasFiltered) {
      this.setDefaultDatesAndLoadData();
    }
    this.getDeviceOptions();
  },

  // 设置为昨天的日期
  setYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    
    const yesterdayStr = `${year}-${month}-${day}`;
    
    this.setData({
      startDate: yesterdayStr,
      endDate: yesterdayStr,
      showYesterdayOnly: true
    });
  },

  // 获取设备选项
  getDeviceOptions() {
    wx.cloud.database().collection('main_inspection_plans')
      .field({
        id: true,
        machine_name: true
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const devices = res.data.map(item => ({
            id: item.id.toString(), // 转换为字符串，方便显示
            name: item.machine_name
          }));
          
          // 添加"全部"选项
          devices.unshift({ id: '', name: '全部设备' });
          
          this.setData({
            deviceOptions: devices
          });
        } else {
          // 如果获取失败，设置一个空的"全部"选项
          this.setData({
            deviceOptions: [{ id: '', name: '全部设备' }]
          });
        }
      })
      .catch(err => {
        console.error('获取设备列表失败:', err);
        // 如果获取失败，设置一个空的"全部"选项
        this.setData({
          deviceOptions: [{ id: '', name: '全部设备' }]
        });
      });
  },

  getRecords(filter) {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    // 直接使用传入的filter对象，不再重新声明
    wx.cloud.callFunction({
      name: 'getMainPatrolRecords',
      data: { filter }, // 将filter对象传递给云函数
      success: res => {
        if (res.result.success) {
          // 在前端简单处理一下，判断是否存在异常项
          const records = res.result.data.map(record => {
            record.hasAbnormal = record.items.some(item => item.isAbnormal);
            return record;
          });
          this.setData({ records });
        } else {
          wx.showToast({ title: '加载失败', icon: 'error' });
        }
      },
      fail: err => {
        wx.showToast({ title: '调用失败', icon: 'error' });
        console.error(err);
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  // 开始日期变化
  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value,
      showYesterdayOnly: false
    });
  },

  // 结束日期变化
  onEndDateChange(e) {
    this.setData({
      endDate: e.detail.value,
      showYesterdayOnly: false
    });
  },

  // 设备选择变化
  onDeviceChange(e) {
    const index = e.detail.value;
    const deviceId = this.data.deviceOptions[index].id;
    
    this.setData({
      deviceIndex: index,
      deviceId: deviceId
    });
  },

  // 应用筛选
  onFilter() {
    this.setData({ hasFiltered: true }); // 标记用户已进行筛选
    this.loadRecords();
  },

  // 重置筛选
  onReset() {
    this.setData({
      deviceIndex: 0,
      hasFiltered: false // 重置筛选标记
    });
    this.setDefaultDatesAndLoadData(); // 重置后加载默认数据
  },

  onPullDownRefresh() {
    this.getRecords();
  },

  goBack() {
    wx.navigateBack();
  },

  // 新增记录按钮事件
  onAddNew() {
    wx.navigateTo({
      url: '/pages/main-patrol/main-patrol'
    });
  },

  // 查看记录详情
  onViewRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/main-patrol-detail/main-patrol-detail?id=${recordId}`
    });
  },

  // 新增：设置默认日期并加载数据
  setDefaultDatesAndLoadData() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = util.formatDate(yesterday);
    const endDate = util.formatDate(today);

    this.setData({
      startDate,
      endDate
    }, () => {
      // 在设置完日期后自动加载数据
      this.loadRecords(); 
    });
  },

  loadRecords() {
    const filter = {
      startDate: this.data.startDate,
      endDate: this.data.endDate,
      deviceId: this.data.deviceOptions[this.data.deviceIndex]?.id || null
    };
    this.getRecords(filter);
  }
}); 