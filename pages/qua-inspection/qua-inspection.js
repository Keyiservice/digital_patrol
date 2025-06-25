    // pages/qua-inspection/qua-inspection.js
    const util = require('../../utils/util.js');
    
    Page({
      data: {
        recordId: null, // 用于存储记录ID
        isViewMode: false, // 是否为查看模式
        isLogin: false,
        userName: '',
        loading: false,
        tNumber: '',
        cookieNumber: '',
        projectSelected: '',
        processSelected: '',
        shiftSelected: '',
        currentDate: '',
        currentTime: '',
        inspectionItems: [],
        previousPageData: null
      },
    
      onLoad: function (options) {
        const app = getApp();
        if (!app.checkLoginStatus()) {
          return;
        }
        
        if (options.id) {
          // 如果有ID，说明是查看详情模式
          this.setData({
            recordId: options.id,
            isViewMode: true,
          });
          this.loadRecordDetails(options.id);
        } else {
          // 否则，是新建记录模式
          try {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('acceptDataFromPreviousPage', (data) => {
              console.log('接收到上一页数据:', data);
              const prevData = data.data || {};
              
              this.setData({
                previousPageData: prevData,
                tNumber: prevData.tNumber || '',
                cookieNumber: prevData.cookieNumber || '',
                projectSelected: prevData.projectSelected || '',
                processSelected: prevData.processSelected || '',
                shiftSelected: prevData.shiftSelected || ''
              });
              
              this.updateDateTime();
              this.loadInspectionItems();
            });
          } catch (error) {
            console.error('获取上一页数据失败:', error);
          }
        }
      },
      
      onShow: function() {
        const app = getApp();
        app.checkLoginStatus();
      },
      
      updateDateTime: function() {
        const now = new Date();
        const pad = n => n < 10 ? '0' + n : n;
        const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        this.setData({
          currentDate: date,
          currentTime: time
        });
      },
      
      loadInspectionItems: function() {
        const { projectSelected, processSelected } = this.data;
        
        if (!projectSelected || !processSelected) {
          wx.showToast({ title: '缺少项目或流程参数', icon: 'none' });
          return;
        }
        
        this.setData({ loading: true });
        wx.showLoading({ title: '加载检查项...' });
        
        wx.cloud.callFunction({
          name: 'getQuaInspectionPlan',
          data: {
            project: projectSelected,
            process: processSelected
          },
          success: res => {
            if (res.result && res.result.success && res.result.data.length > 0) {
              const inspectionItems = res.result.data.map(item => {
                // 根据流程和项目描述，决定输入类型
                const isThicknessItem = processSelected === 'BMM' && item.name.includes('厚度');
                return {
                  id: item.id,
                  description: item.name,
                  result: '', // 用于 OK/NG
                  photos: [],
                  type: isThicknessItem ? 'input' : 'radio', // 'input' 用于手动输入，'radio' 用于单选
                  value: '' // 用于存储手动输入的值
                };
              });
              this.setData({ inspectionItems: inspectionItems });
            } else {
              wx.showToast({ title: res.result?.message || '未找到检查项', icon: 'none' });
            }
          },
          fail: err => {
            console.error('获取巡检计划失败:', err);
            wx.showToast({ title: '加载失败，请重试', icon: 'none' });
          },
          complete: () => {
            this.setData({ loading: false });
            wx.hideLoading();
          }
        });
      },
      
      onResultChange(e) {
        const { itemIndex } = e.currentTarget.dataset;
        const value = e.detail.value;
        const { inspectionItems } = this.data;
        inspectionItems[itemIndex].result = value;
        this.setData({ inspectionItems });
      },
      
      onItemInputChange: function(e) {
        const { itemIndex } = e.currentTarget.dataset;
        const value = e.detail.value;
        const { inspectionItems } = this.data;
        inspectionItems[itemIndex].value = value;
        this.setData({ inspectionItems });
      },
      
      takePhoto: function(e) {
        const { itemIndex } = e.currentTarget.dataset;
        const { inspectionItems } = this.data;
        const currentPhotos = inspectionItems[itemIndex].photos || [];
    
        wx.chooseImage({
          count: 5 - currentPhotos.length,
          sizeType: ['original', 'compressed'],
          sourceType: ['album', 'camera'],
          success: (res) => {
            const tempFilePaths = res.tempFilePaths;
            const newPhotos = currentPhotos.concat(tempFilePaths);
            inspectionItems[itemIndex].photos = newPhotos.slice(0, 5);
            this.setData({ inspectionItems });
          }
        });
      },
      
      previewImage: function(e) {
        const { itemIndex, photoIndex } = e.currentTarget.dataset;
        const { inspectionItems } = this.data;
        const current = inspectionItems[itemIndex].photos[photoIndex];
        const urls = inspectionItems[itemIndex].photos;
        wx.previewImage({ current: current, urls: urls });
      },
      
      validateForm: function() {
        for (let i = 0; i < this.data.inspectionItems.length; i++) {
          const item = this.data.inspectionItems[i];
          if (item.type === 'radio' && !item.result) {
            wx.showToast({
              title: `请选择第${i + 1}项检查结果`,
              icon: 'none',
              duration: 2000
            });
            return false;
          }
          if (item.type === 'input' && !item.value.trim()) {
            wx.showToast({
              title: `请输入第${i + 1}项的数值`,
              icon: 'none',
              duration: 2000
            });
            return false;
          }
        }
        return true;
      },
      
      onPrevious: function() {
        wx.navigateBack({ delta: 1 });
      },
      
      onSubmit: function() {
        if (!this.validateForm()) {
          return;
        }
        
        wx.showLoading({ title: '正在上传图片...' });

        const uploadPromises = [];
        const { inspectionItems } = this.data;

        inspectionItems.forEach(item => {
          if (item.photos && item.photos.length > 0) {
            item.photos.forEach(photoPath => {
              if (photoPath.startsWith('wxfile://')) {
                uploadPromises.push(wx.cloud.uploadFile({
                  cloudPath: `qua_patrol_photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`,
                  filePath: photoPath,
                }));
              } else {
                uploadPromises.push(Promise.resolve({ fileID: photoPath }));
              }
            });
          }
        });

        Promise.all(uploadPromises).then(uploadResults => {
          wx.showLoading({ title: '正在保存记录...' });
          let photoIndex = 0;
          const itemsToSave = inspectionItems.map(item => {
            const savedPhotos = [];
            if (item.photos && item.photos.length > 0) {
              for (let i = 0; i < item.photos.length; i++) {
                savedPhotos.push(uploadResults[photoIndex++].fileID);
              }
            }
            return {
              id: item.id,
              description: item.description,
              result: item.type === 'input' ? item.value : item.result,
              photos: savedPhotos,
              type: item.type
            };
          });

          const submitData = {
            project: this.data.projectSelected,
            process: this.data.processSelected,
            shift: this.data.shiftSelected,
            tNumber: this.data.tNumber,
            cookieNumber: this.data.cookieNumber,
            inspectionTime: `${this.data.currentDate} ${this.data.currentTime}`,
            inspector: wx.getStorageSync('userInfo')?.accountName || '未知用户',
            items: itemsToSave
          };
          
          wx.cloud.callFunction({
            name: 'saveQuaPatrolRecord',
            data: { record: submitData },
            success: res => {
              if (res.result && res.result.success) {
                wx.showModal({
                  title: '保存成功',
                  content: '质量巡检记录已保存。',
                  showCancel: false,
                  success: () => wx.reLaunch({ url: '/pages/index/index' })
                });
              } else {
                wx.showToast({ title: res.result?.message || '保存失败', icon: 'none' });
              }
            },
            fail: err => {
              console.error('保存巡检记录失败:', err);
              wx.showToast({ title: '保存失败，请重试', icon: 'none' });
            },
            complete: () => wx.hideLoading()
          });

        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: '图片上传失败，请重试', icon: 'none' });
          console.error('上传图片失败:', err);
        });
      },
      
      // 新增方法：加载单条记录详情
      loadRecordDetails: function(recordId) {
        wx.showLoading({ title: '加载详情...' });
        wx.cloud.callFunction({
          name: 'getQuaPatrolRecords',
          data: { id: recordId },
          success: async res => {
            if (res.result.success && res.result.data) {
              const record = res.result.data;
              
              // **关键修复**：为从数据库加载的 items 重新推断并添加 type 字段
              record.items.forEach(item => {
                const isThicknessItem = record.process === 'BMM' && item.description.includes('厚度');
                item.type = isThicknessItem ? 'input' : 'radio';
              });

              // 将 photos 中的 fileID 转换为临时链接
              const fileIDs = [];
              record.items.forEach(item => {
                if (item.photos && item.photos.length > 0) {
                  fileIDs.push(...item.photos);
                }
              });

              let tempFileUrls = {};
              if (fileIDs.length > 0) {
                const tempUrlRes = await wx.cloud.getTempFileURL({ fileList: fileIDs });
                tempUrlRes.fileList.forEach(file => {
                  tempFileUrls[file.fileID] = file.tempFileURL;
                });
              }
              
              // 替换 record 中的 fileID
              record.items.forEach(item => {
                if (item.photos && item.photos.length > 0) {
                  item.photos = item.photos.map(fileID => tempFileUrls[fileID] || fileID);
                }
              });

              this.setData({
                tNumber: record.tNumber,
                cookieNumber: record.cookieNumber,
                projectSelected: record.project,
                processSelected: record.process,
                shiftSelected: record.shift,
                currentDate: record.inspectionTime.split(' ')[0],
                currentTime: record.inspectionTime.split(' ')[1],
                inspectionItems: record.items
              });
            } else {
              wx.showToast({ title: res.result.message || '加载失败', icon: 'none' });
            }
          },
          fail: err => {
            console.error('获取记录详情失败:', err);
            wx.showToast({ title: '请求失败', icon: 'none' });
          },
          complete: () => {
            wx.hideLoading();
          }
        })
      }
    });