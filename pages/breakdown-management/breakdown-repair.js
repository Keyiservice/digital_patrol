const util = require('../../utils/util.js');

Page({
  data: {
    // 记录ID
    recordId: '',
    // 故障信息
    recordDetail: {},
    // 故障位置
    faultLocation: '',
    // 故障原因
    faultReason: '',
    // 解决方案
    solution: '',
    // 维修结果选项
    repairResultOptions: ['未修复', '临时修复', '修复'],
    repairResultIndex: 2, // 默认选择"修复"
    // 维修结束时间
    repairEndDate: '',
    repairEndTime: '',
    // 是否影响防错
    affectErrorProof: false,
    // 防错序列号及验证结果
    errorProofInfo: '',
    // 是否使用备件
    useSpare: false,
    // 备件名称或料号
    spareParts: '',
    // 是否涉及安全
    involveSafety: false,
    // 维修人员
    repairer: '',
    // 保存状态
    isSaving: false,
    // 是否正在加载
    isLoading: true
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({
        recordId: options.id
      });
      this.fetchRecordDetail(options.id);
    } else {
      wx.showToast({
        title: '缺少记录ID',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    }
    
    // 设置当前日期和时间
    const now = new Date();
    this.setData({
      repairEndDate: util.formatDate(now),
      repairEndTime: util.formatTime(now).substring(11, 16),
      repairer: wx.getStorageSync('userInfo')?.accountName || ''
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
  onFaultLocationInput(e) {
    this.setData({
      faultLocation: e.detail.value
    });
  },
  
  // 故障原因输入
  onFaultReasonInput(e) {
    this.setData({
      faultReason: e.detail.value
    });
  },
  
  // 解决方案输入
  onSolutionInput(e) {
    this.setData({
      solution: e.detail.value
    });
  },
  
  // 维修结果选择
  onRepairResultChange(e) {
    this.setData({
      repairResultIndex: e.detail.value
    });
  },
  
  // 维修结束日期变更
  onRepairEndDateChange(e) {
    this.setData({
      repairEndDate: e.detail.value
    });
  },
  
  // 维修结束时间变更
  onRepairEndTimeChange(e) {
    this.setData({
      repairEndTime: e.detail.value
    });
  },
  
  // 是否影响防错切换
  onAffectErrorProofChange(e) {
    this.setData({
      affectErrorProof: e.detail.value
    });
  },
  
  // 防错序列号及验证结果输入
  onErrorProofInfoInput(e) {
    this.setData({
      errorProofInfo: e.detail.value
    });
  },
  
  // 是否使用备件切换
  onUseSpareChange(e) {
    this.setData({
      useSpare: e.detail.value
    });
  },
  
  // 备件名称或料号输入
  onSparePartsInput(e) {
    this.setData({
      spareParts: e.detail.value
    });
  },
  
  // 是否涉及安全切换
  onInvolveSafetyChange(e) {
    this.setData({
      involveSafety: e.detail.value
    });
  },
  
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
  }
}); 