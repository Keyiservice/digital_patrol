const util = require('../../utils/util.js');

Page({
  data: {
    // ---- 状态控制 ----
    mode: 'edit', // 'edit' (填写模式) 或 'view' (查看模式)
    recordId: null,
    isSaving: false,

    // ---- 数据模型 ----
    // 存储从数据库加载的完整记录，用于显示顶部的"原始报修信息"
    recordDetail: {}, 
    
    // 维修信息表单的各个字段
    faultLocation: '',
    faultReason: '',
    solution: '',
    repairResultOptions: ['未修复', '临时修复', '修复'],
    repairResultIndex: 2, // 默认'修复'
    repairEndDate: '',
    repairEndTime: '',
    affectErrorProof: false,
    errorProofInfo: '',
    useSpare: false,
    spareParts: '',
    involveSafety: false,
    repairer: '',
    repairDate: '',
    repairTime: '',
    faultCategory: '',
    repairedBy: ''
  },

  onLoad(options) {
    // 1. 安全检查：必须有 ID
    if (!options.id) {
      wx.showToast({ title: '无效的记录ID', icon: 'none' });
      wx.navigateBack();
      return;
    }

    // 2. 模式判断：从上级页面接收 mode 参数，如果不存在，则默认为 'edit' 模式
    const mode = options.mode || 'edit'; 

    // 3. 设置页面状态和导航栏标题
    this.setData({
      recordId: options.id,
      mode: mode,
    });
    wx.setNavigationBarTitle({
      title: mode === 'view' ? '查看维修信息' : '填写维修信息'
    });

    // 4. 从数据库加载记录的详细信息
    this.loadRecord(options.id);

    // 5. 如果是 'edit' 模式，则预填维修人员和当前时间
    if (mode === 'edit') {
      const now = new Date();
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        repairer: userInfo.accountName || '',
        repairEndDate: util.formatDate(now),
        repairEndTime: util.formatTime(now).substring(11, 16)
      });
    }
  },
  
  // 统一的数据加载函数
  loadRecord(id) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'getBreakdownRecord',
      data: { id: id },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const record = res.result.data;
          
          // **核心：将数据库返回的数据完整地填充到页面的 data 中**
          this.setData({
            // 填充顶部"原始报修信息"
            recordDetail: record,

            // 填充"维修信息"表单的每一个字段，如果数据库中没有，则使用默认值
            faultLocation: record.faultLocation || '',
            faultReason: record.faultReason || '',
            solution: record.solution || '',
            repairResultIndex: this.data.repairResultOptions.indexOf(record.repairResult) !== -1 ? this.data.repairResultOptions.indexOf(record.repairResult) : 2,
            repairEndDate: record.repairEndDate || this.data.repairEndDate,
            repairEndTime: record.repairEndTime || this.data.repairEndTime,
            affectErrorProof: record.affectErrorProof || false,
            errorProofInfo: record.errorProofInfo || '',
            useSpare: record.useSpare || false,
            spareParts: record.spareParts || '',
            involveSafety: record.involveSafety || false,
            repairer: record.repairer || this.data.repairer, // 查看时用记录中的人，填写时用当前登录的人
            repairDate: record.repairDate || util.formatDate(new Date()),
            repairTime: record.repairTime || util.formatTime(new Date()).substring(11, 16),
            faultCategory: record.faultCategory || '',
            repairedBy: record.repairedBy || ''
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
  
  // 获取故障记录详情
  async fetchRecordDetail(id) {
    try {
      this.setData({ isLoading: true });
      
      if (id.startsWith('local_')) {
        this.getLocalRecord(id);
        return;
      }
      
      const res = await wx.cloud.callFunction({
        name: 'getBreakdownRecord',
        data: { id }
      });
      
      if (res && res.result && res.result.data) {
        // 处理云端返回数据
        const record = res.result.data;
        this.setData({
          recordDetail: record,
          isLoading: false
        });
      } else {
        wx.showToast({
          title: '记录不存在',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      }
    } catch (err) {
      console.error('获取故障记录失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      this.getLocalRecord(id);
    }
  },
  
  // 获取本地记录
  getLocalRecord(id) {
    const localRecords = wx.getStorageSync('breakdownRecords') || [];
    const record = localRecords.find(r => r.id === id);
    
    if (record) {
      this.setData({
        recordDetail: record,
        isLoading: false
      });
    } else {
      wx.showToast({
        title: '本地记录不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    }
  },
  
  // 故障位置输入
  onFaultLocationInput(e) { this.setData({ faultLocation: e.detail.value }); },
  // 故障原因输入
  onFaultReasonInput(e) { this.setData({ faultReason: e.detail.value }); },
  // 解决方案输入
  onSolutionInput(e) { this.setData({ solution: e.detail.value }); },
  // 维修结果选择
  onRepairResultChange(e) { this.setData({ repairResultIndex: e.detail.value }); },
  // 维修结束日期变更
  onRepairEndDateChange(e) { this.setData({ repairEndDate: e.detail.value }); },
  // 维修结束时间变更
  onRepairEndTimeChange(e) { this.setData({ repairEndTime: e.detail.value }); },
  // 是否影响防错切换
  onAffectErrorProofChange(e) { this.setData({ affectErrorProof: e.detail.value }); },
  // 防错序列号及验证结果输入
  onErrorProofInfoInput(e) { this.setData({ errorProofInfo: e.detail.value }); },
  // 是否使用备件切换
  onUseSpareChange(e) { this.setData({ useSpare: e.detail.value }); },
  // 备件名称或料号输入
  onSparePartsInput(e) { this.setData({ spareParts: e.detail.value }); },
  // 是否涉及安全切换
  onInvolveSafetyChange(e) { this.setData({ involveSafety: e.detail.value }); },
  
  // 保存维修信息
  async onSave() {
    if (this.data.isSaving) return;
    
    // 表单验证
    if (!this.data.faultLocation) {
      wx.showToast({
        title: '请输入故障具体位置',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.faultReason) {
      wx.showToast({
        title: '请输入故障原因',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.solution) {
      wx.showToast({
        title: '请输入解决方案',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.affectErrorProof && !this.data.errorProofInfo) {
      wx.showToast({
        title: '请输入防错序列号及验证结果',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.useSpare && !this.data.spareParts) {
      wx.showToast({
        title: '请输入备件名称或料号',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSaving: true });
    wx.showLoading({ title: '提交中...' });
    
    try {
      // 准备更新数据
      const updateData = {
        id: this.data.recordId,
        faultLocation: this.data.faultLocation,
        faultReason: this.data.faultReason,
        solution: this.data.solution,
        repairResult: this.data.repairResultOptions[this.data.repairResultIndex],
        repairEndDate: this.data.repairEndDate,
        repairEndTime: this.data.repairEndTime,
        affectErrorProof: this.data.affectErrorProof,
        errorProofInfo: this.data.errorProofInfo,
        useSpare: this.data.useSpare,
        spareParts: this.data.spareParts,
        involveSafety: this.data.involveSafety,
        repairer: this.data.repairer,
        status: 'repaired', // 已维修，待质检
        updateTime: new Date().toISOString()
      };
      
      // 调用云函数更新记录
      const res = await wx.cloud.callFunction({
        name: 'updateBreakdownRecord',
        data: updateData
      });
      
      wx.hideLoading();
      
      if (res && res.result && res.result.success) {
        wx.showToast({
          title: '维修信息提交成功',
          icon: 'success'
        });
        
        // 跳转回列表页
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      } else {
        // 云函数调用失败，保存到本地
        this.saveToLocal(updateData);
      }
    } catch (err) {
      console.error('保存维修信息失败:', err);
      wx.hideLoading();
      // 失败时保存到本地
      this.saveToLocal(updateData);
    } finally {
      this.setData({ isSaving: false });
    }
  },
  
  // 保存到本地
  saveToLocal(updateData) {
    try {
      const localRecords = wx.getStorageSync('breakdownRecords') || [];
      const index = localRecords.findIndex(r => r.id === this.data.recordId);
      
      if (index !== -1) {
        // 更新现有记录
        localRecords[index] = {
          ...localRecords[index],
          ...updateData
        };
      }
      
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
  
  // 返回
  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onCancel() {
    wx.navigateBack({ delta: 1 });
  }
}); 