// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { record } = event;

  if (!record) {
    return {
      success: false,
      message: '缺少巡检记录数据'
    };
  }

  try {
    const res = await db.collection('qua_patrol_records').add({
      data: {
        ...record,
        _openid: openid, // 记录创建者的openid
        createTime: db.serverDate(), // 记录服务器创建时间
      }
    });
    
    return {
      success: true,
      message: '保存成功',
      data: res._id
    };

  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
}; 