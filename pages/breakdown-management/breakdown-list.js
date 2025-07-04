Page({
  data: {
    records: [],
    filteredRecords: [],
    isFirstLoad: true,  // 标记是否首次加载
    showLoadMore: false, // 是否显示加载更多按钮
    totalRecords: 0, // 记录总数
    // 筛选条件
    statusOptions: ['全部状态', '待维修', '待质检', '已完成'],
    statusIndex: 0,
    startDate: '',
    endDate: ''
  },

  onLoad() {
    this.fetchRecords(null, true); // 首次加载只显示未完成的故障记录
  },

  onShow() {
    // onShow可以不强制刷新
  },

  fetchRecords(filter = null, pendingOnly = false) {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getBreakdownRecords',
      data: { filter, pendingOnly },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const records = res.result.data.map(record => {
            switch(record.status) {
              case 'pending': record.statusText = '待维修'; break;
              case 'repaired': record.statusText = '待质检'; break;
              case 'completed': record.statusText = '已完成'; break;
              default: record.statusText = '未知'; break;
            }
            return record;
          });
          
          const hasMoreRecords = res.result.total > records.length;
          
          this.setData({ 
            records: records, 
            filteredRecords: records,
            isFirstLoad: false,
            showLoadMore: pendingOnly && hasMoreRecords, // 如果是只显示未完成且有更多记录，则显示加载更多按钮
            totalRecords: res.result.total || 0
          });
        } else {
          this.setData({ 
            records: [],
            filteredRecords: [],
            showLoadMore: false
          });
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: err => {
        wx.hideLoading();
        this.setData({ 
          records: [],
          filteredRecords: [],
          showLoadMore: false
        });
        wx.showToast({ title: '请求失败', icon: 'none' });
        console.error("failed to call getBreakdownRecords", err);
      }
    });
  },

  // 加载所有故障记录
  loadAllRecords() {
    this.fetchRecords();
  },

  onStatusChange(e) {
    this.setData({ statusIndex: e.detail.value });
  },

  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  onFilter() {
    const statusOption = this.data.statusOptions[this.data.statusIndex];
    let status = '';
    if (statusOption === '待维修') status = 'pending';
    if (statusOption === '待质检') status = 'repaired';
    if (statusOption === '已完成') status = 'completed';

    const filter = {
      status: status,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    Object.keys(filter).forEach(key => {
      if (!filter[key] || filter[key] === '全部状态') delete filter[key];
    });
    this.fetchRecords(Object.keys(filter).length > 0 ? filter : null, false);
    this.setData({ showLoadMore: false }); // 筛选后不显示加载更多按钮
  },

  onReset() {
    this.setData({
      statusIndex: 0,
      startDate: '',
      endDate: '',
      showLoadMore: false // 重置后不显示加载更多按钮
    });
    this.fetchRecords(null, true); // 重置后显示未完成的记录
  },

  onViewDetails(e) {
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    
    if (!id) return;
    
    switch (status) {
      case 'pending':
        // 待维修状态，跳转到维修信息页面
        wx.navigateTo({ url: `./breakdown-repair?id=${id}` });
        break;
      case 'repaired':
        // 待质检状态，跳转到质量验证页面
        wx.navigateTo({ url: `./breakdown-quality?id=${id}` });
        break;
      case 'completed':
        // 已完成状态，根据情况选择一个页面查看详情
        wx.showActionSheet({
          itemList: ['查看生产报修', '查看维修信息', '查看质检信息'],
          success: (res) => {
            switch (res.tapIndex) {
              case 0:
                wx.navigateTo({ url: `./breakdown-production?id=${id}&mode=view` });
                break;
              case 1:
                wx.navigateTo({ url: `./breakdown-repair?id=${id}&mode=view` });
                break;
              case 2:
                wx.navigateTo({ url: `./breakdown-quality?id=${id}&mode=view` });
                break;
            }
          }
        });
        break;
      default:
        wx.navigateTo({ url: `./breakdown-production?id=${id}&mode=view` });
    }
  },

  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: res => {
        if (res.confirm) {
          if (id.toString().startsWith('local_')) {
            this.deleteLocalRecord(id);
          } else {
            this.deleteCloudRecord(id);
          }
        }
      }
    });
  },
  
  deleteCloudRecord(id) {
    wx.showLoading({ title: '删除中...' });
    wx.cloud.callFunction({
      name: 'deleteBreakdownRecord',
      data: { id },
      success: res => {
        wx.hideLoading();
        if (res && res.result && res.result.success) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.fetchRecords(null, this.data.isFirstLoad); // 保持当前视图状态
        } else {
          wx.showToast({ title: '删除失败', icon: 'error' });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('删除记录失败:', err);
        wx.showToast({ title: '删除失败', icon: 'error' });
      }
    });
  },
  
  deleteLocalRecord(id) {
    try {
      const localRecords = wx.getStorageSync('breakdownRecords') || [];
      const index = localRecords.findIndex(r => r.id === id);
      if (index !== -1) {
        localRecords.splice(index, 1);
        wx.setStorageSync('breakdownRecords', localRecords);
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.fetchRecords(null, this.data.isFirstLoad); // 保持当前视图状态
      } else {
        wx.showToast({ title: '记录不存在', icon: 'error' });
      }
    } catch (e) {
      console.error('删除本地记录失败:', e);
      wx.showToast({ title: '删除失败', icon: 'error' });
    }
  },

  onAddNew() {
    wx.navigateTo({ url: './breakdown-production' });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
}); 