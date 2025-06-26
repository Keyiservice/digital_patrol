// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const npCollection = db.collection('np_records')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID
  const { id, record } = event

  // 确保 record 对象存在且不为空
  if (!record || typeof record !== 'object' || Object.keys(record).length === 0) {
    return { success: false, message: '无效的记录数据' }
  }

  try {
    if (id) {
      // 更新模式：合并记录和更新信息
      const updateData = {
        ...record,
        updatedTime: db.serverDate(),
        updatedBy: openId
      }
      await npCollection.doc(id).update({ data: updateData })
      return { success: true, message: '记录更新成功', id: id }

    } else {
      // 创建模式：合并记录和创建信息
      const addData = {
        ...record,
        status: 'Open',
        createdBy: openId,
        createTime: db.serverDate(),
        updatedTime: db.serverDate(),
        updatedBy: openId
      }
      const res = await npCollection.add({ data: addData })
      return { success: true, message: '记录添加成功', id: res._id }
    }
  } catch (e) {
    console.error('数据库操作失败:', e)
    return {
      success: false,
      message: '数据库操作失败: ' + e.message
    }
  }
} 