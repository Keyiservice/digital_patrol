// main-patrol.js
// 引入时间格式化工具
const util = require('../../utils/util.js');

Page({
  data: {
    scanCompleted: false, // 新增：用于控制是否显示扫码界面
    inspectionStartTime: '', // 新增：巡检开始时间
    inspectionAreas: [
      '吹塑机主体设备', 
      '加热系统', 
      '压缩空气系统', 
      '冷却系统', 
      '模具系统', 
      '原料供给系统', 
      '废料处理系统', 
      '安全防护系统'
    ],
    areaIndex: 0,
    currentArea: '',
    inspectionItems: [],
    
    // 用于存储所有区域的巡检项目
    allInspectionItems: {
      '吹塑机主体设备': [
        {
          id: 'mechanical_stability',
          name: '机械状态检查',
          type: 'select',
          label: '机架稳定性',
          options: ['正常', '轻微晃动', '明显晃动', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'lubrication',
          name: '机械状态检查',
          type: 'select',
          label: '传动系统润滑',
          options: ['良好', '一般', '不足', '干涩'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'fasteners',
          name: '机械状态检查',
          type: 'select',
          label: '紧固件松动检查',
          options: ['无松动', '轻微松动', '明显松动', '需要紧固'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'hydraulic_oil',
          name: '液压系统',
          type: 'select',
          label: '液压油油位',
          options: ['正常', '略低', '过低', '需要添加'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'oil_temp',
          name: '液压系统',
          type: 'number',
          label: '油温监控',
          placeholder: '输入油温',
          unit: '℃',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'pressure_gauge',
          name: '液压系统',
          type: 'number',
          label: '压力表读数',
          placeholder: '输入压力值',
          unit: 'MPa',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'leakage',
          name: '液压系统',
          type: 'select',
          label: '软管及接头渗漏',
          options: ['无渗漏', '轻微渗漏', '明显渗漏', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'control_cabinet',
          name: '电气系统',
          type: 'select',
          label: '控制柜散热',
          options: ['良好', '一般', '较差', '过热'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'cable_integrity',
          name: '电气系统',
          type: 'select',
          label: '电缆护套完整性',
          options: ['完好', '轻微磨损', '明显磨损', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'indicator_lights',
          name: '电气系统',
          type: 'select',
          label: '指示灯状态',
          options: ['全部正常', '部分异常', '多数异常', '全部异常'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'emergency_button',
          name: '电气系统',
          type: 'select',
          label: '急停按钮功能',
          options: ['正常', '不灵敏', '失效', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'main_photo',
          name: '设备照片',
          type: 'photo',
          label: '设备状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '加热系统': [
        {
          id: 'zone_temp',
          name: '加热区温度监控',
          type: 'number',
          label: '区域温度设定值',
          placeholder: '输入温度',
          unit: '℃',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'temp_controller',
          name: '加热区温度监控',
          type: 'select',
          label: '温控表显示正常',
          options: ['正常', '波动', '不准确', '失效'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'heater_appearance',
          name: '加热区温度监控',
          type: 'select',
          label: '加热器外观检查',
          options: ['良好', '轻微异常', '明显异常', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'insulation',
          name: '保温层完整性',
          type: 'select',
          label: '保温层状态',
          options: ['完好', '轻微损坏', '明显损坏', '需要修复'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'sensor_wiring',
          name: '温度传感器线路',
          type: 'select',
          label: '线路状态',
          options: ['良好', '轻微磨损', '明显磨损', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'heating_photo',
          name: '加热系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '压缩空气系统': [
        {
          id: 'compressor_status',
          name: '空压机运行状态',
          type: 'select',
          label: '运行状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'tank_pressure',
          name: '储气罐压力',
          type: 'number',
          label: '压力值',
          placeholder: '输入压力',
          unit: 'MPa',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'air_leakage',
          name: '管路漏气检查',
          type: 'select',
          label: '漏气情况',
          options: ['无漏气', '轻微漏气', '明显漏气', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'filter_cleanliness',
          name: '过滤器清洁度',
          type: 'select',
          label: '清洁状态',
          options: ['清洁', '轻微脏污', '明显脏污', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'drain_function',
          name: '排水器功能',
          type: 'select',
          label: '功能状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'air_system_photo',
          name: '压缩空气系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '冷却系统': [
        {
          id: 'cooling_pump',
          name: '冷却水循环泵运行',
          type: 'select',
          label: '运行状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'water_temp_in',
          name: '水温监控',
          type: 'number',
          label: '进水温度',
          placeholder: '输入温度',
          unit: '℃',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'water_temp_out',
          name: '水温监控',
          type: 'number',
          label: '出水温度',
          placeholder: '输入温度',
          unit: '℃',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'cooling_tower_fan',
          name: '冷却塔风机状态',
          type: 'select',
          label: '风机状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'pipes_valves',
          name: '管路及阀门检查',
          type: 'select',
          label: '状态',
          options: ['良好', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'water_quality',
          name: '水质清洁度',
          type: 'select',
          label: '清洁度',
          options: ['清洁', '轻微污染', '明显污染', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'cooling_system_photo',
          name: '冷却系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '模具系统': [
        {
          id: 'mold_cleanliness',
          name: '模具表面清洁',
          type: 'select',
          label: '清洁度',
          options: ['清洁', '轻微脏污', '明显脏污', '需要清洁'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'mold_positioning',
          name: '模具定位精度',
          type: 'select',
          label: '定位精度',
          options: ['精确', '轻微偏差', '明显偏差', '需要调整'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'cooling_water_flow',
          name: '冷却水路畅通',
          type: 'select',
          label: '水路状态',
          options: ['畅通', '轻微阻塞', '明显阻塞', '需要清理'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'ejection_mechanism',
          name: '顶出机构动作',
          type: 'select',
          label: '动作状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'mold_wear',
          name: '模具磨损程度',
          type: 'select',
          label: '磨损程度',
          options: ['无磨损', '轻微磨损', '明显磨损', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'mold_system_photo',
          name: '模具系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '原料供给系统': [
        {
          id: 'hopper_level',
          name: '料斗料位',
          type: 'select',
          label: '料位状态',
          options: ['充足', '中等', '较低', '需要添加'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'conveying_pipe',
          name: '输送管路畅通',
          type: 'select',
          label: '管路状态',
          options: ['畅通', '轻微阻塞', '明显阻塞', '需要清理'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'dryer_temp',
          name: '干燥机温度及时间',
          type: 'number',
          label: '干燥机温度',
          placeholder: '输入温度',
          unit: '℃',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'dryer_time',
          name: '干燥机温度及时间',
          type: 'number',
          label: '干燥时间',
          placeholder: '输入时间',
          unit: 'h',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'material_quality',
          name: '原料质量外观',
          type: 'select',
          label: '外观质量',
          options: ['良好', '轻微异常', '明显异常', '不合格'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'dehumidifier',
          name: '除湿装置运行',
          type: 'select',
          label: '运行状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'material_system_photo',
          name: '原料供给系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '废料处理系统': [
        {
          id: 'waste_collector',
          name: '废料收集装置',
          type: 'select',
          label: '装置状态',
          options: ['良好', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'crusher_status',
          name: '粉碎机运行状态',
          type: 'select',
          label: '运行状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'recycle_ratio',
          name: '回收比例记录',
          type: 'number',
          label: '回收比例',
          placeholder: '输入百分比',
          unit: '%',
          value: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'cleanliness',
          name: '清洁卫生状况',
          type: 'select',
          label: '卫生状况',
          options: ['清洁', '轻微脏污', '明显脏污', '需要清理'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'waste_system_photo',
          name: '废料处理系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ],
      '安全防护系统': [
        {
          id: 'safety_light_curtain',
          name: '安全光栅功能',
          type: 'select',
          label: '功能状态',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'safety_guards',
          name: '防护罩完整性',
          type: 'select',
          label: '完整性',
          options: ['完好', '轻微损坏', '明显损坏', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'safety_signs',
          name: '安全标识清晰度',
          type: 'select',
          label: '清晰度',
          options: ['清晰', '轻微模糊', '明显模糊', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'emergency_switch',
          name: '应急开关测试',
          type: 'select',
          label: '测试结果',
          options: ['正常', '轻微异常', '明显异常', '需要维修'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'fire_equipment',
          name: '消防器材检查',
          type: 'select',
          label: '器材状态',
          options: ['良好', '轻微异常', '明显异常', '需要更换'],
          selectedIndex: 0,
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        },
        {
          id: 'safety_system_photo',
          name: '安全防护系统照片',
          type: 'photo',
          label: '系统状态照片',
          imageUrl: '',
          isAbnormal: false,
          abnormalDesc: '',
          abnormalLevel: 'low'
        }
      ]
    }
  },

  onLoad() {
    // 页面加载时不再自动加载巡检项，等待用户扫码
  },

  // 新增：扫描二维码
  scanQRCode() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        const deviceId = res.result;
        console.log('扫码成功，设备ID:', deviceId);
        wx.showLoading({ title: '获取巡检计划...' });

        // 调用云函数获取巡检计划
        wx.cloud.callFunction({
          name: 'getInspectionPlanByDevice',
          data: {
            deviceId: deviceId
          },
          success: (cfRes) => {
            wx.hideLoading();
            if (cfRes.result.success && cfRes.result.data) {
              const plan = cfRes.result.data;
              // 从数据库动态加载巡检内容
              this.setData({
                scanCompleted: true,
                inspectionStartTime: util.formatTime(new Date()),
                // 直接使用返回的数据，不再有 inspectionData 嵌套
                currentArea: plan.deviceName || '维修巡检', // 使用 plan.deviceName 作为标题
                inspectionItems: plan.items || [] // 使用 plan.items 作为巡检项
              });
            } else {
              wx.showModal({
                title: '获取失败',
                content: cfRes.result.message || '未找到该设备的巡检计划。',
                showCancel: false
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            wx.showToast({
              title: '请求失败',
              icon: 'error'
            });
            console.error('云函数调用失败:', err);
          }
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '扫码取消或失败',
          icon: 'none'
        })
        console.error('扫码失败:', err);
      }
    });
  },

  onAreaChange(e) {
    const index = e.detail.value;
    const area = this.data.inspectionAreas[index];
    this.setData({
      areaIndex: index,
      currentArea: area,
      inspectionItems: JSON.parse(JSON.stringify(this.data.allInspectionItems[area]))
    });
  },

  onValueInput(e) {
    const { value } = e.detail;
    const { id } = e.currentTarget.dataset;
    const items = this.data.inspectionItems;
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      this.setData({
        [`inspectionItems[${itemIndex}].value`]: value
      });
    }
  },

  onOptionChange(e) {
    const { value } = e.detail;
    const { id } = e.currentTarget.dataset;
    const items = this.data.inspectionItems;
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      this.setData({
        [`inspectionItems[${itemIndex}].selectedIndex`]: value
      });
    }
  },

  chooseImage(e) {
    const { id } = e.currentTarget.dataset;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        const items = this.data.inspectionItems;
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex > -1) {
          this.setData({
            [`inspectionItems[${itemIndex}].imageUrl`]: tempFilePath
          });
        }
      }
    });
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      urls: [url]
    });
  },

  // 新增：处理 OK/NG 结果变化
  onResultChange(e) {
    const { value } = e.detail;
    const { id } = e.currentTarget.dataset;
    const items = this.data.inspectionItems;
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      this.setData({
        [`inspectionItems[${itemIndex}].isAbnormal`]: value === 'NG'
      });
    }
  },

  onAbnormalInput(e) {
    const { value } = e.detail;
    const { id } = e.currentTarget.dataset;
    const items = this.data.inspectionItems;
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      this.setData({
        [`inspectionItems[${itemIndex}].abnormalDesc`]: value
      });
    }
  },

  onLevelChange(e) {
    const { value } = e.detail;
    const { id } = e.currentTarget.dataset;
    const items = this.data.inspectionItems;
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      this.setData({
        [`inspectionItems[${itemIndex}].abnormalLevel`]: value
      });
    }
  },

  onCancel() {
    wx.showModal({
      title: '确认返回',
      content: '所有未保存的数据将会丢失，确定要返回吗？',
      confirmText: "确定",
      cancelText: "取消",
      success: res => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  onSubmit() {
    let emptyRequired = false;
    let abnormalDescMissing = false;

    this.data.inspectionItems.forEach(item => {
      if (item.type === 'number' && (item.value === '' || item.value === null)) {
        emptyRequired = true;
      }
      if (item.isAbnormal && !item.abnormalDesc.trim()) {
        abnormalDescMissing = true;
      }
    });

    if (emptyRequired) {
      wx.showToast({ title: '请填写所有数值项', icon: 'none' });
      return;
    }

    if (abnormalDescMissing) {
      wx.showToast({ title: '请为NG项填写异常描述', icon: 'none' });
      return;
    }

    const submitData = {
      area: this.data.currentArea,
      inspectionTime: this.data.inspectionStartTime, // 使用开始巡检时的时间
      inspector: wx.getStorageSync('userInfo')?.accountName || '未知用户',
      items: this.data.inspectionItems,
    };
    
    wx.showLoading({ title: '正在保存...' });
    
    // 调用云函数保存数据
    wx.cloud.callFunction({
      name: 'saveMainPatrolRecord',
      data: {
        record: submitData
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showModal({
            title: '保存成功',
            content: '巡检记录已成功保存。',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
        } else {
          wx.showToast({
            title: res.result.message || '保存失败',
            icon: 'error'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '调用云函数失败',
          icon: 'error'
        });
        console.error('调用 saveMainPatrolRecord 云函数失败:', err);
      }
    });
  }
}); 