// pages/asm/asm.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    assemblyDefect: '',
    missingParts: '',
    wrongParts: '',
    damagedParts: '',
    functionTest: '',
    previousPageData: null,
    processType: '', // FC 或 ASM
    currentStep: 1    // 当前是第几步
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取上一页传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromPreviousPage', (data) => {
      let processType = 'ASM';
      let currentStep = 1;
      
      // 判断是FC流程还是ASM流程
      if (data.data && data.data.fcPageOne) {
        processType = 'FC';
        currentStep = 2; // 如果从FC第一页来，这里是FC第二页
      } else if (data.data && data.data.fcPageTwo) {
        processType = 'FC';
        currentStep = 3; // FC第三页
      } else if (data.data && data.data.fcPageThree) {
        processType = 'FC';
        currentStep = 4; // FC第四页
      } else if (data.data && data.data.asmPageOne) {
        processType = 'ASM';
        currentStep = 2; // ASM第二页
      } else if (data.data && data.data.asmPageTwo) {
        processType = 'ASM';
        currentStep = 3; // ASM第三页
      } else if (data.data && data.data.asmPageThree) {
        processType = 'ASM';
        currentStep = 4; // ASM第四页
      }
      
      // 更新数据
      this.setData({
        previousPageData: data.data || {},
        processType: processType,
        currentStep: currentStep
      });
      
      // 设置标题
      let pageTitle = '';
      if (processType === 'FC') {
        pageTitle = `FC CHECK - PAGE ${currentStep}`;
      } else {
        pageTitle = `ASM CHECK - PAGE ${currentStep}`;
      }
      
      wx.setNavigationBarTitle({
        title: pageTitle
      });
    });
  },

  /**
   * 处理单选按钮变化
   */
  onAssemblyDefectChange: function(e) {
    this.setData({
      assemblyDefect: e.detail.value
    });
  },

  onMissingPartsChange: function(e) {
    this.setData({
      missingParts: e.detail.value
    });
  },

  onWrongPartsChange: function(e) {
    this.setData({
      wrongParts: e.detail.value
    });
  },

  onDamagedPartsChange: function(e) {
    this.setData({
      damagedParts: e.detail.value
    });
  },

  onFunctionTestChange: function(e) {
    this.setData({
      functionTest: e.detail.value
    });
  },
  
  /**
   * 验证表单是否填写完整
   */
  validateForm: function() {
    if (!this.data.assemblyDefect) {
      wx.showToast({
        title: '请选择ASSEMBLY DEFECT状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.missingParts) {
      wx.showToast({
        title: '请选择MISSING PARTS状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.wrongParts) {
      wx.showToast({
        title: '请选择WRONG PARTS状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.damagedParts) {
      wx.showToast({
        title: '请选择DAMAGED PARTS状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    if (!this.data.functionTest) {
      wx.showToast({
        title: '请选择FUNCTION TEST状态',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    
    return true;
  },

  /**
   * 处理上一页按钮点击
   */
  onPrevious: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 处理下一页按钮点击
   */
  onNext: function() {
    // 验证表单
    if (!this.validateForm()) {
      return;
    }
    
    // 收集当前页面数据
    const currentData = {
      assemblyDefect: this.data.assemblyDefect,
      missingParts: this.data.missingParts,
      wrongParts: this.data.wrongParts,
      damagedParts: this.data.damagedParts,
      functionTest: this.data.functionTest
    };
    
    // 检查是否是最后一页
    const isLastPage = (
      (this.data.processType === 'FC' && this.data.currentStep === 4) ||
      (this.data.processType === 'ASM' && this.data.currentStep === 4)
    );
    
    if (isLastPage) {
      // 如果是最后一页，合并所有数据并提交
      const finalData = {
        ...this.data.previousPageData,
        ...currentData,
        completionTime: new Date().toISOString()
      };
      
      // 这里添加数据提交逻辑
      console.log('提交的最终数据:', finalData);
      
      // 提交完成后返回首页
      wx.showToast({
        title: '巡检完成，数据已提交！',
        icon: 'success',
        duration: 2000,
        success: function() {
          setTimeout(function() {
            wx.reLaunch({
              url: '/pages/index/index'
            });
          }, 2000);
        }
      });
    } else {
      // 如果不是最后一页，准备跳转到下一页
      let nextPageData = { ...this.data.previousPageData };
      
      // 根据当前流程和步骤，添加标记
      if (this.data.processType === 'FC') {
        if (this.data.currentStep === 2) {
          nextPageData = { 
            ...nextPageData, 
            ...currentData,
            fcPageTwo: true 
          };
        } else if (this.data.currentStep === 3) {
          nextPageData = { 
            ...nextPageData, 
            ...currentData,
            fcPageThree: true 
          };
        }
      } else { // ASM流程
        if (this.data.currentStep === 1) {
          nextPageData = { 
            ...nextPageData, 
            ...currentData,
            asmPageOne: true 
          };
        } else if (this.data.currentStep === 2) {
          nextPageData = { 
            ...nextPageData, 
            ...currentData,
            asmPageTwo: true 
          };
        } else if (this.data.currentStep === 3) {
          nextPageData = { 
            ...nextPageData, 
            ...currentData,
            asmPageThree: true 
          };
        }
      }
      
      // 跳转到下一页（这里重用ASM页面来模拟不同的检查页面）
      wx.navigateTo({
        url: '/pages/asm/asm',
        success: function(res) {
          // 传递数据给下一页
          res.eventChannel.emit('acceptDataFromPreviousPage', { data: nextPageData });
        }
      });
    }
  }
}) 