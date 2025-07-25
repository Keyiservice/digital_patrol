// 云函数入口文件
const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 检查是否已经在数据库中创建了集合和数据
    const countResult = await db.collection('qua_inspection_plans').count();
    if (countResult.total > 0) {
      return {
        success: true,
        message: '质量巡检计划已存在，如需重新初始化，请先清空集合',
        existingCount: countResult.total
      };
    }

    // 从云存储中获取CSV文件
    let csvData;
    try {
      // 尝试从云存储获取
      const fileID = 'cloud://your-cloud-env-id.xxxx/QUA-PATROL.csv'; // 请替换为实际的文件ID
      const res = await cloud.downloadFile({
        fileID: fileID,
      });
      csvData = res.fileContent.toString('utf8');
    } catch (e) {
      // 如果从云存储获取失败，则使用内嵌的CSV数据
      console.error('从云存储获取CSV失败，使用内嵌数据:', e);
      csvData = `Project,Process,Item1,Item2,Item3,Item4,Item5,Item6,Item7,Item8,Item9,Item10,Item11
G68,BMM,条码外观检验：条形码无缺失、无漏贴、褶皱，粘贴在指定位置框里，扫描区域清晰、无模糊G68,油箱外观检验：表面无磕伤、变形、脏污、粘料；污渍；ICV、Nipple、辅泵焊接面无油渍、表面平整；安装排气管的clip区域无破损、变形、多料G68,"主、副泵口吹针孔均匀；密封面无划痕,无凹陷,无气泡,无凸起G68",合模线外观无开口、露白；合模线起始位置和终止位置正确G68,主泵口E-Ring完全包裹、后墙无空洞、气泡G68,超声波厚度仪使用校准块进行校验G68,ICV焊接面厚度4mm MinG68,Nipple焊接面厚度 4mm MinG68,(Left pump焊接面整周厚度): 4mm MinG68,"检查油箱内部是否存在合模线气泡等目视可见缺陷G68
（需要机加开泵口查看）","铭牌 ID Plate检查：模压图案，生产年月标，批号正确，清晰;COOKIE冷却模号标识正确,.检验合格后划线标识如图G68"
G68,FC,ICV焊接双翻边外观完整、无气泡、无缺失、无损伤、内部无粘料；翻边无变小或焊深趋势，若有怀疑确认切片熔深；ICV元件无损伤；ICV焊接区域内壳体外观无磕伤、划伤或其它异常；ICV 挡板活动顺畅，无缺失G68,Nipple焊接双翻边外观完整、无气泡、无缺失、无损伤、内部无粘料；Nipple元件无损伤；Nipple焊接区域壳体外观无磕伤、划伤或其它异常G68,主泵支架焊接双翻边外观清晰，整周完整无缺失、无损伤；主泵支架元件无损伤G68,副泵支架焊接双翻边外观清晰，整周完整无缺失无损伤；副泵支架元件无损伤G68,副泵baffle支架(蓝bracket)焊接双翻边外观清晰，整周完整无缺失无损伤、元件无损伤G68,spacer支架焊接双翻边外观清晰，整周完整无缺失无损伤、元件无损伤G68,主、副泵口，冲孔开孔外观无毛刺、无泵口未开掉，内部有slug或异物；主泵密封面无异物，泵口壁薄，双眼皮（多肉）G68,,,,
G68,ASM,蒸发系统各管路连接无打折、夹伤；管路安装间隙≤3mm为合格（目视检验，不确定时使用塞尺）G68,排气管安装间隙≤3mm为合格(目视检验，不确定时使用塞尺)G68,锁紧环锁紧到位，锁环无锈蚀裂纹，密封圈无外露；法兰端子及油泵无变形损伤，卡子不破损G68,Coverplate焊接双翻边清晰，整周完整无缺失、无损伤、无气泡；无偏移趋势G68,有氦检确认标识G68,排气管安装到位无脱出现象，管路长度确认无异常G68,,,,,
P71A,BMM,条码外观检验：条形码无缺失、无漏贴、褶皱，粘贴在指定位置框里，扫描区域清晰、无模糊P71A,油箱外观检验：表面无磕伤、变形、脏污、粘料；污渍；ICV、Nipple、辅泵焊接面无油渍、表面平整；安装排气管的clip区域无破损、变形、多料P71A,"主、副泵口吹针孔均匀；密封面无划痕,无凹陷,无气泡,无凸起P71A",合模线外观无开口、露白；合模线起始位置和终止位置正确P71A,主泵口E-Ring完全包裹、后墙无空洞、气泡P71A,超声波厚度仪使用校准块进行校验P71A,ICV焊接面厚度4mm MinP71A,Nipple焊接面厚度 4mm MinP71A,(Left pump焊接面整周厚度): 4mm MinP71A,"检查油箱内部是否存在合模线气泡等目视可见缺陷P71A
（需要机加开泵口查看）","铭牌 ID Plate检查：模压图案，生产年月标，批号正确，清晰;COOKIE冷却模号标识正确,.检验合格后划线标识如图P71A"
P71A,FC,ICV焊接双翻边外观完整、无气泡、无缺失、无损伤、内部无粘料；翻边无变小或焊深趋势，若有怀疑确认切片熔深；ICV元件无损伤；ICV焊接区域内壳体外观无磕伤、划伤或其它异常；ICV 挡板活动顺畅，无缺失P71A,Nipple焊接双翻边外观完整、无气泡、无缺失、无损伤、内部无粘料；Nipple元件无损伤；Nipple焊接区域壳体外观无磕伤、划伤或其它异常P71A,主泵支架焊接双翻边外观清晰，整周完整无缺失、无损伤；主泵支架元件无损伤P71A,副泵支架焊接双翻边外观清晰，整周完整无缺失无损伤；副泵支架元件无损伤P71A,副泵baffle支架(蓝bracket)焊接双翻边外观清晰，整周完整无缺失无损伤、元件无损伤P71A,spacer支架焊接双翻边外观清晰，整周完整无缺失无损伤、元件无损伤P71A,主、副泵口，冲孔开孔外观无毛刺、无泵口未开掉，内部有slug或异物；主泵密封面无异物，泵口壁薄，双眼皮（多肉）P71A,,,,
P71A,ASM,蒸发系统各管路连接无打折、夹伤；管路安装间隙≤3mm为合格（目视检验，不确定时使用塞尺）P71A,排气管安装间隙≤3mm为合格(目视检验，不确定时使用塞尺)P71A,锁紧环锁紧到位，锁环无锈蚀裂纹，密封圈无外露；法兰端子及油泵无变形损伤，卡子不破损P71A,Coverplate焊接双翻边清晰，整周完整无缺失、无损伤、无气泡；无偏移趋势P71A,有氦检确认标识P71A,排气管安装到位无脱出现象，管路长度确认无异常P71A,,,,,
D2XX,BMM,条码外观检验：条形码无缺失、无漏贴、褶皱，粘贴在指定位置框里，扫描区域清晰、无模糊D2XX,油箱外观检验：表面无磕伤、变形、脏污、粘料；污渍；ICV、Nipple、辅泵焊接面无油渍、表面平整；安装排气管的clip区域无破损、变形、多料D2XX,"主、副泵口吹针孔均匀；密封面无划痕,无凹陷,无气泡,无凸起D2XX",合模线外观无开口、露白；合模线起始位置和终止位置正确D2XX,主泵口E-Ring完全包裹、后墙无空洞、气泡D2XX,超声波厚度仪使用校准块进行校验D2XX,ICV焊接面厚度4mm MinD2XX,Nipple焊接面厚度 4mm MinD2XX,(Left pump焊接面整周厚度): 4mm MinD2XX,"检查油箱内部是否存在合模线气泡等目视可见缺陷D2XX
（需要机加开泵口查看）","铭牌 ID Plate检查：模压图案，生产年月标，批号正确，清晰;COOKIE冷却模号标识正确,.检验合格后划线标识如图D2XX"
D2XX,FC,ICV焊接双翻边外观完整、无气泡、无缺失、无损伤、内部无粘料；翻边无变小或焊深趋势，若有怀疑确认切片熔深；ICV元件无损伤；ICV焊接区域内壳体外观无磕伤、划伤或其它异常；ICV 挡板活动顺畅，无缺失D2XX,Nipple焊接双翻边外观完整、无气泡、无缺失、无损伤、内部无粘料；Nipple元件无损伤；Nipple焊接区域壳体外观无磕伤、划伤或其它异常D2XX,主泵支架焊接双翻边外观清晰，整周完整无缺失、无损伤；主泵支架元件无损伤D2XX,副泵支架焊接双翻边外观清晰，整周完整无缺失无损伤；副泵支架元件无损伤D2XX,副泵baffle支架(蓝bracket)焊接双翻边外观清晰，整周完整无缺失无损伤、元件无损伤D2XX,spacer支架焊接双翻边外观清晰，整周完整无缺失无损伤、元件无损伤D2XX,主、副泵口，冲孔开孔外观无毛刺、无泵口未开掉，内部有slug或异物；主泵密封面无异物，泵口壁薄，双眼皮（多肉）D2XX,,,,
D2XX,ASM,蒸发系统各管路连接无打折、夹伤；管路安装间隙≤3mm为合格（目视检验，不确定时使用塞尺）D2XX,排气管安装间隙≤3mm为合格(目视检验，不确定时使用塞尺)D2XX,锁紧环锁紧到位，锁环无锈蚀裂纹，密封圈无外露；法兰端子及油泵无变形损伤，卡子不破损D2XX,Coverplate焊接双翻边清晰，整周完整无缺失、无损伤、无气泡；无偏移趋势D2XX,有氦检确认标识D2XX,排气管安装到位无脱出现象，管路长度确认无异常D2XX,,,,,`;
    }

    // 解析CSV数据
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    // 批量写入数据库
    const batchTasks = [];
    for (const record of records) {
      batchTasks.push(
        db.collection('qua_inspection_plans').add({
          data: record
        })
      );
    }

    await Promise.all(batchTasks);

    return {
      success: true,
      message: '质量巡检计划初始化成功',
      recordCount: records.length
    };

  } catch (e) {
    console.error('初始化质量巡检计划失败:', e);
    return {
      success: false,
      message: e.message || '初始化质量巡检计划失败',
      error: e
    };
  }
}; 