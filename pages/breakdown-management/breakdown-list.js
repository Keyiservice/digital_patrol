Page({
  data: {
    records: [],
    filteredRecords: [],
    // 筛选条件
    departmentOptions: ['全部', '生产', '质量', '设备'],
    departmentIndex: 0,
    startDate: '',
    endDate: ''
  },

  onLoad() {
    this.fetchRecords();
  },

  onShow() {
    // onShow可以不强制刷新
  },

  fetchRecords(filter = null) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getBreakdownRecords',
      data: { filter },
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
          this.setData({ records: records, filteredRecords: records });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },

  onDepartmentChange(e) {
    this.setData({ departmentIndex: e.detail.value });
  },

  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  onFilter() {
    const department = this.data.departmentOptions[this.data.departmentIndex];
    const filter = {
      department: department === '全部' ? null : department,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    Object.keys(filter).forEach(key => {
      if (!filter[key]) delete filter[key];
    });
    this.fetchRecords(filter);
  },

  onReset() {
    this.setData({
      departmentIndex: 0,
      startDate: '',
      endDate: ''
    });
    this.fetchRecords();
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
          this.fetchRecords();
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
        this.fetchRecords();
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