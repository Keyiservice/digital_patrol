Page({
  data: {
    records: [],
    filteredRecords: [],
    searchDate: '',
    projectOptions: ['ALL', 'UTILITY', 'BMM', 'G68', 'P71A', 'P171', 'E371'],
    projectIndex: 0,
    deviceMap: {
      'ALL': ['全部设备'],
      'UTILITY': ['全部设备', '配电室', '空压机', '冷水机组', '空调'],
      'BMM': ['全部设备', 'Feeding system', 'Grinder', 'BM', 'PC', 'Cooling tower'],
      'G68': ['全部设备', 'FC', 'ASSEMBLY', 'HLT'],
      'P71A': ['全部设备', 'FC', 'ASSEMBLY', 'HLT'],
      'P171': ['全部设备', 'FC', 'ASSEMBLY', 'HLT'],
      'E371': ['全部设备', 'FC', 'ASSEMBLY', 'HLT']
    },
    deviceOptions: ['全部设备'],
    deviceIndex: 0,
    selectedProject: 'ALL',
    selectedDevice: '全部设备',
    startDate: '',
    endDate: ''
  },
  onLoad() {
    this.fetchRecords();
  },
  onShow() {
    // onShow可以不强制刷新，或只刷新默认列表，避免频繁调用
    // this.fetchRecords(); 
  },
  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },
  onProjectChange(e) {
    const projectIndex = e.detail.value;
    const selectedProject = this.data.projectOptions[projectIndex];
    const deviceOptions = this.data.deviceMap[selectedProject] || ['全部设备'];
    this.setData({
      projectIndex,
      selectedProject,
      deviceOptions,
      deviceIndex: 0,
      selectedDevice: '全部设备'
    });
  },
  onDeviceChange(e) {
    const deviceIndex = e.detail.value;
    const selectedDevice = this.data.deviceOptions[deviceIndex];
    this.setData({
      deviceIndex,
      selectedDevice
    });
  },
  onFilter() {
    const filter = {
      tpm_type: this.data.selectedProject === 'ALL' ? null : this.data.selectedProject,
      device_id: this.data.selectedDevice === '全部设备' ? null : this.data.selectedDevice,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    // 清理无效的filter项
    Object.keys(filter).forEach(key => {
      if (!filter[key]) delete filter[key];
    });
    this.fetchRecords(filter);
  },
  onReset() {
    this.setData({
      projectIndex: 0,
      selectedProject: 'ALL',
      deviceOptions: ['全部设备'],
      deviceIndex: 0,
      selectedDevice: '全部设备',
      startDate: '',
      endDate: ''
    });
    this.fetchRecords(); // 不带参数，获取默认10条
  },
  fetchRecords(filter = null) {
    console.log('[TPM列表] 开始获取记录');
    wx.showLoading({ title: 'Loading...' });
    wx.cloud.callFunction({
      name: 'getTpmRecords',
      data: { filter },
      success: res => {
        console.log('[TPM列表] getTpmRecords调用成功, 结果:', res);
        wx.hideLoading();
        
        // 从云端获取数据
        let cloudRecords = [];
        if (res && res.result && res.result.data) {
          console.log('[TPM列表] 云端返回数据条数:', res.result.data.length);
          cloudRecords = res.result.data;
          
          // 处理错误的图片路径
          cloudRecords.forEach(record => {
            if (record.photos && Array.isArray(record.photos)) {
              // 检查并修复示例路径
              record.photos = record.photos.map(photoUrl => {
                if (photoUrl && photoUrl.includes('your-env-id')) {
                  // 返回一个通用错误占位图或空字符串
                  return '';
                }
                return photoUrl;
              });
            }
          });
        } else {
          console.log('[TPM列表] 云端未返回数据或数据为空');
        }
        
        // 从本地获取数据
        const localRecords = wx.getStorageSync('tpmRecords') || [];
        console.log('[TPM列表] 本地数据条数:', localRecords.length);
        
        // 合并云端和本地数据
        console.log('[TPM列表] 合并云端和本地数据');
        const allRecords = [...cloudRecords];
        
        // 添加未同步到云端的本地记录
        localRecords.forEach(localItem => {
          const isInCloud = cloudRecords.some(cloudItem => {
            // 如果本地item有id且与云端_id相同，或其他唯一标识相同
            return (localItem.id && cloudItem._id === localItem.id) || 
                  (localItem.createTime && cloudItem.createTime === localItem.createTime);
          });
          
          if (!isInCloud) {
            console.log('[TPM列表] 添加本地记录到合并列表:', localItem);
            allRecords.push(localItem);
          }
        });
        
        // 按创建时间降序排序
        const sorted = allRecords.sort((a, b) => {
          // 处理不同格式的createTime
          const timeA = typeof a.createTime === 'string' ? new Date(a.createTime).getTime() : a.createTime;
          const timeB = typeof b.createTime === 'string' ? new Date(b.createTime).getTime() : b.createTime;
          return timeB - timeA;
        });
        
        console.log('[TPM列表] 最终展示数据条数:', sorted.length);
        this.setData({ records: sorted, filteredRecords: sorted });
      },
      fail: err => {
        console.error('[TPM列表] getTpmRecords调用失败:', err);
        wx.hideLoading();
        this.getRecordsFromStorage();
        wx.showToast({ title: '展示本地数据', icon: 'none' });
      }
    });
  },
  getRecordsFromStorage() {
    console.log('[TPM列表] 从本地存储获取记录');
    const localRecords = wx.getStorageSync('tpmRecords') || [];
    console.log('[TPM列表] 本地数据条数:', localRecords.length);
    
    if (localRecords.length > 0) {
      const sorted = localRecords.sort((a, b) => {
        // 处理不同格式的createTime
        const timeA = typeof a.createTime === 'string' ? new Date(a.createTime).getTime() : a.createTime;
        const timeB = typeof b.createTime === 'string' ? new Date(b.createTime).getTime() : b.createTime;
        return timeB - timeA;
      });
      console.log('[TPM列表] 本地数据排序完成');
      this.setData({ records: sorted, filteredRecords: sorted });
    } else {
      console.log('[TPM列表] 本地无数据');
      this.setData({ records: [], filteredRecords: [] });
    }
  },
  clearSearch() {
    this.setData({ 
      searchDate: '',
      projectIndex: 0,
      selectedProject: 'ALL',
      deviceOptions: ['全部设备'],
      deviceIndex: 0,
      selectedDevice: '全部设备',
      startDate: '',
      endDate: ''
    });
  },
  onViewRecord(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      // 跳转到详情页面（只读模式）
      wx.navigateTo({ 
        url: `/pages/tpm-management/tpm-record?id=${id}&mode=view` 
      });
    }
  },
  onEditRecord(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    
    // 本地记录不支持编辑
    if (id.toString().startsWith('local_')) {
      wx.showToast({
        title: '本地记录不支持编辑',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到编辑页面
    wx.navigateTo({ 
      url: `/pages/tpm-management/tpm-record?id=${id}&mode=edit` 
    });
  },
  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条TPM记录吗？',
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
  // 删除云端记录
  deleteCloudRecord(id) {
    wx.showLoading({ title: '删除中...' });
    wx.cloud.callFunction({
      name: 'deleteTpmRecord',
      data: { id },
      success: res => {
        wx.hideLoading();
        console.log('[TPM列表] 删除云记录结果:', res);
        if (res && res.result && res.result.success) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.fetchRecords();  // 重新获取记录列表
        } else {
          wx.showToast({ title: '删除失败', icon: 'error' });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('[TPM列表] 删除云记录失败:', err);
        wx.showToast({ title: '删除失败', icon: 'error' });
      }
    });
  },
  // 删除本地记录
  deleteLocalRecord(id) {
    try {
      const localRecords = wx.getStorageSync('tpmRecords') || [];
      const index = localRecords.findIndex(r => r.id === id);
      if (index !== -1) {
        localRecords.splice(index, 1);
        wx.setStorageSync('tpmRecords', localRecords);
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.fetchRecords();  // 重新获取记录列表
      } else {
        wx.showToast({ title: '记录不存在', icon: 'error' });
      }
    } catch (e) {
      console.error('[TPM列表] 删除本地记录失败:', e);
      wx.showToast({ title: '删除失败', icon: 'error' });
    }
  },
  onPreviewPhoto(e) {
    const photos = e.currentTarget.dataset.photos || [];
    const index = e.currentTarget.dataset.index;
    // 确保照片数组存在且非空
    if (Array.isArray(photos) && photos.length > 0) {
      wx.previewImage({
        urls: photos,
        current: photos[index]
      });
    } else {
      // 如果照片数组不存在或为空，尝试使用当前项的photos属性
      const currentItem = e.currentTarget;
      const currentPhoto = currentItem.dataset.src || currentItem.src;
      if (currentPhoto) {
        wx.previewImage({
          urls: [currentPhoto],
          current: currentPhoto
        });
      }
    }
  },
  // 处理图片加载错误
  onImageError(e) {
    console.log('图片加载错误:', e);
    // 可以在这里设置默认图片
    // e.target.setData({ src: '/images/default_image.png' });
  },
  onAddNew() {
    wx.navigateTo({ url: '/pages/tpm-management/tpm-record' });
  },
  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});
