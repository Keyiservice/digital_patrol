const util = require('../../utils/util.js');

Page({
  data: {
    records: [],
    isLoading: false,
    isFirstLoad: true,  // 标记是否首次加载
    showLoadMore: false, // 是否显示加载更多按钮
    totalRecords: 0, // 记录总数
    
    // 筛选条件
    startDate: '',
    endDate: '',
    deviceId: '',
    deviceOptions: [],
    deviceIndex: 0,
    isLoadingDevices: false, // 标记是否正在加载设备列表
    
    // 是否只显示昨天的记录
    showYesterdayOnly: true,
    hasFiltered: false // 新增：用于标记是否进行过筛选
  },

  onLoad() {
    // 获取设备列表
    this.getDeviceOptions();
    
    // 在onLoad时就开始加载最新5条数据，不等待onShow
    console.log('onLoad: 首次加载最新5条数据');
    this.fetchRecords(null, 5);
  },

  onShow() {
    // 页面显示时，如果不是首次加载且没有进行过筛选，则刷新数据
    if (!this.data.isFirstLoad && !this.data.hasFiltered) {
      console.log('onShow: 刷新最新5条数据');
      this.fetchRecords(null, 5);
    } else {
      console.log('onShow: 跳过加载，isFirstLoad=', this.data.isFirstLoad, 'hasFiltered=', this.data.hasFiltered);
    }
  },

  // 获取设备选项
  getDeviceOptions() {
    // 防止重复加载
    if (this.data.isLoadingDevices) {
      return;
    }
    
    // 标记正在加载设备列表
    this.setData({
      isLoadingDevices: true
    });
    
    // 使用云函数获取设备列表，避免全表扫描
    wx.showLoading({
      title: '加载设备列表...',
      mask: true
    });
    
    try {
      wx.cloud.callFunction({
        name: 'getDeviceList',
        data: {
          limit: 200 // 设置合理的限制
        },
        success: res => {
          console.log('getDeviceList返回结果:', JSON.stringify(res.result));
          
          if (res.result && res.result.success && res.result.data && Array.isArray(res.result.data)) {
            // 检查数据是否符合预期格式
            if (res.result.data.length > 0) {
              // 确保数据中包含必要的字段
              const validData = res.result.data.filter(item => item && (item.id !== undefined || item._id) && item.machine_name);
              
              if (validData.length > 0) {
                const devices = validData.map(item => ({
                  id: (item.id !== undefined) ? item.id.toString() : (item._id ? item._id : ''), // 转换为字符串，防止id为null或undefined
                  name: item.machine_name || '未命名设备'
                }));
                
                // 添加"全部"选项
                devices.unshift({ id: '', name: '全部设备' });
                
                this.setData({
                  deviceOptions: devices
                });
                console.log('成功加载设备列表，数量:', devices.length);
              } else {
                // 没有有效数据
                this.setData({
                  deviceOptions: [{ id: '', name: '全部设备' }]
                });
                console.warn('设备列表中没有包含必要字段的有效数据');
              }
            } else {
              // 空数据
              this.setData({
                deviceOptions: [{ id: '', name: '全部设备' }]
              });
              console.warn('设备列表为空');
            }
          } else {
            // 返回格式不正确
            this.setData({
              deviceOptions: [{ id: '', name: '全部设备' }]
            });
            console.error('获取设备列表失败或数据格式不正确：', res);
          }
        },
        fail: err => {
          console.error('调用获取设备列表云函数失败:', err);
          // 如果获取失败，设置一个空的"全部"选项
          this.setData({
            deviceOptions: [{ id: '', name: '全部设备' }]
          });
          wx.showToast({
            title: '加载设备列表失败',
            icon: 'none'
          });
        },
        complete: () => {
          // 确保在complete回调中隐藏loading并重置加载状态
          wx.hideLoading();
          this.setData({
            isLoadingDevices: false
          });
        }
      });
    } catch (e) {
      console.error('获取设备列表异常:', e);
      this.setData({
        deviceOptions: [{ id: '', name: '全部设备' }],
        isLoadingDevices: false
      });
      wx.hideLoading();
    }
  },

  fetchRecords(filter = null, limit = null) {
    // 防止重复加载
    if (this.data.isLoading) {
      return;
    }
    
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    // 记录调用参数，便于调试
    console.log('fetchRecords调用参数:', { filter, limit });

    try {
      wx.cloud.callFunction({
        name: 'getMainPatrolRecords',
        data: { 
          filter, 
          limit: limit !== null ? parseInt(limit) : null 
        }, 
        success: res => {
          // 记录返回结果，便于调试
          console.log('getMainPatrolRecords返回结果:', res.result);
          
          if (res.result && res.result.success) {
            // 在前端简单处理一下，判断是否存在异常项
            if (res.result.data && Array.isArray(res.result.data)) {
              const records = res.result.data.map(record => {
                // 确保items存在
                if (record.items && Array.isArray(record.items)) {
                  record.hasAbnormal = record.items.some(item => item.isAbnormal);
                } else {
                  record.hasAbnormal = false;
                }
                return record;
              });
              
              const hasMoreRecords = res.result.total > records.length;
              console.log(`加载了 ${records.length}/${res.result.total} 条记录，hasMoreRecords=${hasMoreRecords}`);
              
              this.setData({ 
                records: records,
                isFirstLoad: false,
                showLoadMore: limit && hasMoreRecords, // 如果有限制且还有更多记录，则显示加载更多按钮
                totalRecords: res.result.total || 0
              });
            } else {
              console.error('返回的数据格式不正确:', res.result);
              this.setData({
                records: [],
                isFirstLoad: false,
                showLoadMore: false,
                totalRecords: 0
              });
              wx.showToast({ title: '数据格式错误', icon: 'error' });
            }
          } else {
            console.error('加载失败:', res.result);
            wx.showToast({ title: '加载失败', icon: 'error' });
          }
        },
        fail: err => {
          console.error('获取巡检记录失败:', err);
          wx.showToast({ title: '调用失败', icon: 'error' });
        },
        complete: () => {
          // 确保在complete回调中隐藏loading
          wx.hideLoading();
          this.setData({ isLoading: false });
          wx.stopPullDownRefresh();
        }
      });
    } catch (e) {
      console.error('fetchRecords异常:', e);
      // 确保发生异常时也能隐藏loading
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
      wx.showToast({ title: '加载异常', icon: 'error' });
    }
  },

  // 加载所有记录
  loadAllRecords() {
    // 防止重复操作
    if (this.data.isLoading) {
      return;
    }
    
    try {
      this.fetchRecords();
    } catch (e) {
      console.error('加载所有记录时出错:', e);
      // 确保错误时也能隐藏loading
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
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
    // 防止重复操作
    if (this.data.isLoading) {
      return;
    }
    
    const filter = {
      startDate: this.data.startDate,
      endDate: this.data.endDate,
      deviceId: this.data.deviceOptions[this.data.deviceIndex]?.id || null
    };
    
    this.setData({ 
      hasFiltered: true, // 标记用户已进行筛选
      showLoadMore: false // 筛选后不显示加载更多按钮
    });
    
    try {
      // 应用筛选并加载数据
      this.fetchRecords(filter);
    } catch (e) {
      console.error('应用筛选时出错:', e);
      // 确保错误时也能隐藏loading
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({
        title: '筛选失败',
        icon: 'error'
      });
    }
  },

  // 重置筛选
  onReset() {
    // 防止重复操作
    if (this.data.isLoading) {
      return;
    }
    
    // 先更新状态
    this.setData({
      startDate: '',
      endDate: '',
      deviceIndex: 0,
      deviceId: '',
      hasFiltered: false, // 重置筛选标记
      showLoadMore: false // 重置后不显示加载更多按钮
    });
    
    try {
      // 重置后重新加载最新5条数据
      this.fetchRecords(null, 5);
    } catch (e) {
      console.error('重置筛选时出错:', e);
      // 确保错误时也能隐藏loading
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  onPullDownRefresh() {
    // 防止重复操作
    if (this.data.isLoading) {
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
      return;
    }
    
    try {
      // 下拉刷新时，如果之前有筛选，则保持筛选条件，否则加载最新5条
      if (this.data.hasFiltered) {
        const filter = {
          startDate: this.data.startDate,
          endDate: this.data.endDate,
          deviceId: this.data.deviceOptions[this.data.deviceIndex]?.id || null
        };
        this.fetchRecords(filter);
      } else {
        this.fetchRecords(null, 5);
      }
    } catch (e) {
      console.error('下拉刷新时出错:', e);
      // 确保错误时也能隐藏loading和停止下拉刷新
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    }
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

  // 设置默认日期并加载数据
  setDefaultDatesAndLoadData() {
    // 防止重复操作
    if (this.data.isLoading) {
      return;
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = util.formatDate(yesterday);
    const endDate = util.formatDate(today);

    this.setData({
      startDate,
      endDate
    }, () => {
      try {
        // 在设置完日期后自动加载数据
        this.fetchRecords({
          startDate: this.data.startDate,
          endDate: this.data.endDate,
          deviceId: this.data.deviceOptions[this.data.deviceIndex]?.id || null
        });
      } catch (e) {
        console.error('设置默认日期并加载数据时出错:', e);
        // 确保错误时也能隐藏loading
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    });
  },

  // 加载记录函数，修正调用
  loadRecords() {
    // 防止重复操作
    if (this.data.isLoading) {
      return;
    }
    
    const filter = {
      startDate: this.data.startDate,
      endDate: this.data.endDate,
      deviceId: this.data.deviceOptions[this.data.deviceIndex]?.id || null
    };
    
    try {
      // 加载筛选后的记录
      this.fetchRecords(filter);
    } catch (e) {
      console.error('加载记录时出错:', e);
      // 确保错误时也能隐藏loading
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  }
}); 