Page({
  data: {
    records: [],
    filteredRecords: [],
    // 筛选条件
    statusOptions: ['全部状态', '待维修', '待质检', '已完成'],
    statusIndex: 0,
    dateRange: ''
  },

  onLoad() {
    this.fetchRecords();
  },

  onShow() {
    this.fetchRecords();
  },

  fetchRecords() {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getBreakdownRecords',
      success: res => {
        wx.hideLoading();
        
        // 获取云端数据
        let cloudRecords = [];
        if (res && res.result && res.result.data) {
          cloudRecords = res.result.data;
        }
        
        // 获取本地数据
        const localRecords = wx.getStorageSync('breakdownRecords') || [];
        
        // 合并云端和本地数据
        const allRecords = [...cloudRecords];
        
        // 添加未同步到云端的本地记录
        localRecords.forEach(localItem => {
          const isInCloud = cloudRecords.some(cloudItem => {
            return (localItem.id && cloudItem._id === localItem.id) || 
                  (localItem.createTime && cloudItem.createTime === localItem.createTime);
          });
          
          if (!isInCloud) {
            allRecords.push(localItem);
          }
        });
        
        // 处理状态显示
        allRecords.forEach(record => {
          switch(record.status) {
            case 'pending':
              record.statusText = '待维修';
              break;
            case 'repaired':
              record.statusText = '待质检';
              break;
            case 'completed':
              record.statusText = '已完成';
              break;
            default:
              record.statusText = '未知状态';
              break;
          }
        });
        
        // 按创建时间降序排序
        const sorted = allRecords.sort((a, b) => {
          const timeA = typeof a.createTime === 'string' ? new Date(a.createTime).getTime() : a.createTime;
          const timeB = typeof b.createTime === 'string' ? new Date(b.createTime).getTime() : b.createTime;
          return timeB - timeA;
        });
        
        this.setData({ records: sorted }, this.filterRecords);
      },
      fail: err => {
        console.error('获取记录失败:', err);
        wx.hideLoading();
        this.getRecordsFromStorage();
        wx.showToast({ title: '展示本地数据', icon: 'none' });
      }
    });
  },

  getRecordsFromStorage() {
    const localRecords = wx.getStorageSync('breakdownRecords') || [];
    
    localRecords.forEach(record => {
      switch(record.status) {
        case 'pending':
          record.statusText = '待维修';
          break;
        case 'repaired':
          record.statusText = '待质检';
          break;
        case 'completed':
          record.statusText = '已完成';
          break;
        default:
          record.statusText = '未知状态';
          break;
      }
    });
    
    if (localRecords.length > 0) {
      const sorted = localRecords.sort((a, b) => {
        const timeA = typeof a.createTime === 'string' ? new Date(a.createTime).getTime() : a.createTime;
        const timeB = typeof b.createTime === 'string' ? new Date(b.createTime).getTime() : b.createTime;
        return timeB - timeA;
      });
      this.setData({ records: sorted }, this.filterRecords);
    } else {
      this.setData({ records: [] }, this.filterRecords);
    }
  },

  onStatusChange(e) {
    const statusIndex = e.detail.value;
    this.setData({ statusIndex }, this.filterRecords);
  },

  onDateChange(e) {
    const dateRange = e.detail.value;
    this.setData({ dateRange }, this.filterRecords);
  },

  clearFilter() {
    this.setData({
      statusIndex: 0,
      dateRange: ''
    }, this.filterRecords);
  },
  
  filterRecords() {
    const { records, statusIndex, dateRange } = this.data;
    
    let filtered = [...records];
    
    // 按状态筛选
    if (statusIndex > 0) {
      const statusText = this.data.statusOptions[statusIndex];
      filtered = filtered.filter(r => r.statusText === statusText);
    }
    
    // 按日期筛选
    if (dateRange) {
      filtered = filtered.filter(r => {
        const recordDate = r.reportDate || r.inspectionDate;
        return recordDate === dateRange;
      });
    }
    
    this.setData({ filteredRecords: filtered });
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