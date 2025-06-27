Page({
  /**
   * 页面的初始数据
   */
  data: {
    records: [], // 存储记录列表
    // 更新筛选字段
    projectOptions: ['ALL', 'D2XX', 'G68', 'P71A', 'P171', 'E371'], // 项目选项
    projectIndex: 0,
    treatmentOptions: ['ALL', 'Rework', 'Scrap', 'On-Hold', 'Use as it'], // 处理方式选项
    treatmentIndex: 0,
    startDate: '',
    endDate: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取不合格品记录列表
    this.fetchRecords();
    // 获取项目选项
    this.loadProjectOptions();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时刷新列表，确保有新增或修改的记录时能够显示
    this.fetchRecords();
  },

  /**
   * 获取项目选项
   */
  loadProjectOptions: function() {
    wx.showLoading({ title: '加载项目选项...' });
    try {
      wx.cloud.callFunction({
        name: 'getProjectOptions',
        success: res => {
          wx.hideLoading();
          if (res.result && res.result.success) {
            // 添加"ALL"选项作为第一个选项
            const options = ['ALL', ...res.result.data];
            this.setData({
              projectOptions: options
            });
          } else {
            console.error('获取项目选项失败:', res);
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('调用获取项目选项云函数失败:', err);
        }
      });
    } catch (e) {
      wx.hideLoading();
      console.error('加载项目选项出错:', e);
    }
  },

  /**
   * 获取记录列表
   */
  fetchRecords: function (filter = null) {
    wx.showLoading({
      title: 'Loading...',
      mask: true
    });

    // 尝试从云函数获取记录
    try {
      wx.cloud.callFunction({
        name: 'getNpRecords',
        data: { filter },
        success: res => {
          wx.hideLoading();
          
          // 检查是否成功获取记录
          if (res && res.result && res.result.data) {
            // 按创建时间降序排序
            const sortedRecords = res.result.data.sort((a, b) => {
              return b.createTime - a.createTime;
            });
            
            this.setData({
              records: sortedRecords
            });
          } else {
            // 如果云获取失败，尝试从本地存储获取
            this.getRecordsFromStorage();
            console.error('未获取到云记录数据');
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('[云函数] [getNpRecords] 调用失败：', err);
          
          // 从本地存储获取
          this.getRecordsFromStorage();
          
          wx.showToast({
            title: '展示本地数据',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (e) {
      wx.hideLoading();
      console.error('云函数调用出错：', e);
      
      // 从本地存储获取
      this.getRecordsFromStorage();
      
      wx.showToast({
        title: '展示本地数据',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 从本地存储获取记录列表
   */
  getRecordsFromStorage: function() {
    const storageRecords = wx.getStorageSync('npRecords') || [];
    
    // 按创建时间降序排序
    const sortedRecords = storageRecords.sort((a, b) => {
      return b.createTime - a.createTime;
    });
    
    this.setData({
      records: sortedRecords
    });
  },

  /**
   * 查看记录详情
   */
  onViewRecord: function (e) {
    const recordId = e.currentTarget.dataset.id;
    if (recordId) {
      // 跳转到详情页面
      wx.navigateTo({
        url: `/pages/np-management/np-entry?id=${recordId}&mode=view`
      });
    }
  },

  /**
   * 编辑记录
   */
  onEditRecord: function (e) {
    const recordId = e.currentTarget.dataset.id;
    if (recordId) {
      // 跳转到编辑页面
      wx.navigateTo({
        url: `/pages/np-management/np-entry?id=${recordId}&mode=edit`
      });
    }
  },

  /**
   * 删除记录
   */
  onDeleteRecord: function (e) {
    const recordId = e.currentTarget.dataset.id;
    if (recordId) {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？删除后无法恢复。',
        success: res => {
          if (res.confirm) {
            // 判断是本地记录还是云记录
            if (recordId.startsWith('local_')) {
              this.deleteLocalRecord(recordId);
            } else {
              this.deleteCloudRecord(recordId);
            }
          }
        }
      });
    }
  },

  /**
   * 删除云记录
   */
  deleteCloudRecord: function (recordId) {
    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    try {
      wx.cloud.callFunction({
        name: 'deleteNpRecord',
        data: { id: recordId },
        success: res => {
          wx.hideLoading();
          
          // 检查是否删除成功
          if (res && res.result && res.result.success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            });
            
            // 重新获取记录列表
            this.fetchRecords();
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error',
              duration: 2000
            });
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('[云函数] [deleteNpRecord] 调用失败：', err);
          wx.showToast({
            title: '删除失败',
            icon: 'error',
            duration: 2000
          });
        }
      });
    } catch (e) {
      wx.hideLoading();
      console.error('云函数调用出错：', e);
      wx.showToast({
        title: '删除失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  /**
   * 删除本地记录
   */
  deleteLocalRecord: function(recordId) {
    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    try {
      // 获取本地存储的记录
      const storageRecords = wx.getStorageSync('npRecords') || [];
      
      // 过滤掉要删除的记录
      const filteredRecords = storageRecords.filter(item => item.id !== recordId);
      
      // 更新本地存储
      wx.setStorageSync('npRecords', filteredRecords);
      
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 2000
      });
      
      // 更新页面数据
      this.setData({
        records: filteredRecords
      });
    } catch (e) {
      wx.hideLoading();
      console.error('本地删除出错：', e);
      wx.showToast({
        title: '删除失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  /**
   * 添加新记录
   */
  onAddNew: function () {
    wx.navigateTo({
      url: '/pages/np-management/np-entry'
    });
  },

  /**
   * 返回首页
   */
  onBack: function () {
    wx.navigateBack({
      delta: 1
    });
  },
  
  // 处理项目选择变化
  onProjectChange: function(e) {
    this.setData({ 
      projectIndex: e.detail.value 
    });
  },
  
  // 处理处理方式选择变化
  onTreatmentChange: function(e) {
    this.setData({ 
      treatmentIndex: e.detail.value 
    });
  },
  
  // 处理日期变化
  onDateChange: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  // 筛选按钮点击
  onFilter: function() {
    const filter = {};
    
    // 只有当不是选择"ALL"时，才添加筛选条件
    if (this.data.projectIndex > 0) {
      filter.project = this.data.projectOptions[this.data.projectIndex];
    }
    
    if (this.data.treatmentIndex > 0) {
      filter.treatment = this.data.treatmentOptions[this.data.treatmentIndex];
    }
    
    if (this.data.startDate) {
      filter.startDate = this.data.startDate;
    }
    
    if (this.data.endDate) {
      filter.endDate = this.data.endDate;
    }
    
    this.fetchRecords(filter);
  },

  // 重置按钮点击
  onReset: function() {
    this.setData({
      projectIndex: 0,
      treatmentIndex: 0,
      startDate: '',
      endDate: ''
    });
    this.fetchRecords();
  }
}); 