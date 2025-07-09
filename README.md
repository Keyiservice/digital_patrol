# 数字巡检小程序

## 项目概述

数字巡检是一款专为现代化生产车间打造的微信小程序，旨在革新传统纸质巡检和报修流程。通过将业务流程数字化、移动化，构建一个透明、高效、可追溯的线上协作平台。

### 核心目标

- **无纸化办公**：消除纸质记录的填写、传递和归档成本
- **提升效率**：巡检员和工程师可随时随地通过手机完成任务，数据实时同步
- **强化数据追溯**：所有操作均有时间戳和责任人记录，为质量分析和管理决策提供可靠数据基础
- **优化协作流程**：打通生产、维修、质量部门间的信息壁垒，加速故障响应和处理速度

## 技术架构

- **前端**：微信小程序原生框架 (WXML, WXSS, JS, WXS)
- **后端**：微信云开发 (Tencent Cloud Base)
  - **云函数**：使用 Node.js 编写，承载所有后端业务逻辑
  - **云数据库**：基于 MongoDB 的 NoSQL 文档数据库
  - **云存储**：存储用户上传的图片文件，通过 `fileID` 与数据库记录关联

## 用户系统

### 登录与注册

- **登录页面** (`/pages/login/login`)
  - 用户输入账号和密码进行身份验证
  - 登录信息存储在本地缓存，便于后续使用

- **注册页面** (`/pages/register/register`)
  - 新用户注册，填写基本信息
  - 通过 `signUp` 云函数创建新用户

### 用户信息组件

- **用户信息组件** (`/components/user-info`)
  - 显示当前登录用户的信息
  - 提供登出功能

## 核心功能模块

### 1. 主线巡检 (Main Patrol)

主线巡检模块用于执行设备的常规巡检任务，确保设备正常运行。

#### 页面与功能

- **主线巡检列表** (`/pages/main-patrol-list/main-patrol-list`)
  - 显示最近的巡检记录
  - 支持查看历史巡检数据
  - 提供"开始巡检"入口

- **主线巡检执行页** (`/pages/main-patrol/main-patrol`)
  - 通过扫码识别设备
  - 显示设备基本信息
  - 根据预设的巡检项目列表执行检查
  - 支持异常项拍照上传和描述记录

- **巡检详情页** (`/pages/main-patrol-detail/main-patrol-detail`)
  - 查看已完成巡检的详细信息
  - 显示巡检项目及结果
  - 查看异常项的照片和描述

#### 数据流

1. 用户扫描设备二维码或手动输入设备ID
2. 系统调用 `getMainInspectionPlan` 云函数获取该设备的巡检计划
3. 用户完成巡检项目检查，记录异常情况
4. 提交时调用 `saveMainPatrolRecord` 云函数保存记录

### 2. 质量巡检 (Quality Patrol)

质量巡检模块用于执行产品或产线的质量抽检任务。

#### 页面与功能

- **质量巡检页面** (`/pages/qua-patrol/qua-patrol`)
  - 选择项目、过程和班次
  - 显示巡检项目列表
  - 支持拍照记录和结果输入

- **质量巡检列表** (`/pages/qua-patrol-list/qua-patrol-list`)
  - 显示历史质量巡检记录
  - 支持按项目、产线、检查员和日期范围筛选

- **外观检查页面** (`/pages/appearance_first/appearance_first`, `/pages/appearance_second/appearance_second`)
  - 专门用于产品外观检查
  - 分页显示检查项目
  - 支持OK/NG状态选择和照片上传

#### 数据流

1. 用户选择巡检项目和过程
2. 系统调用 `getQuaInspectionPlan` 云函数获取巡检计划
3. 用户完成巡检项目检查，记录结果和拍照
4. 提交时先上传图片到云存储，获取 `fileID`
5. 调用 `saveQuaPatrolRecord` 云函数保存完整记录

### 3. 故障报修管理 (Breakdown Management)

故障报修模块实现了从"发现故障"到"解决问题"的闭环工作流，基于状态机的流转机制。

#### 页面与功能

- **故障报修列表** (`/pages/breakdown-management/breakdown-list`)
  - 显示所有故障报修记录
  - 按状态分类：待维修、待质检、已完成
  - 提供新增报修入口

- **生产报修页** (`/pages/breakdown-management/breakdown-production`)
  - 填写故障设备、问题描述
  - 上传故障现场照片
  - 创建初始状态为"待维修"的记录

- **设备维修页** (`/pages/breakdown-management/breakdown-repair`)
  - 维修人员填写维修措施、故障原因
  - 记录维修时间和维修人员
  - 将状态更新为"待质检"

- **质量验证页** (`/pages/breakdown-management/breakdown-quality`)
  - 质量人员验证维修结果
  - 填写验证信息
  - 将状态更新为"已完成"

#### 数据流与状态转换

| 状态 | 含义 | 触发页面 | 下一状态 |
|------|------|---------|---------|
| `pending` | 待维修 | `breakdown-production` | `repaired` |
| `repaired` | 待质检 | `breakdown-repair` | `completed` |
| `completed` | 已完成 | `breakdown-quality` | (最终态) |

1. 生产报修：调用 `saveBreakdownRecord` 云函数创建记录
2. 设备维修：调用 `updateBreakdownRecord` 云函数更新状态
3. 质量验证：再次调用 `updateBreakdownRecord` 云函数完成流程

### 4. TPM管理 (Total Productive Maintenance)

TPM管理模块用于记录设备的预防性维护和保养工作。

#### 页面与功能

- **TPM记录页** (`/pages/tpm-management/tpm-record`)
  - 选择设备类型和具体设备
  - 记录保养时间和保养人
  - 上传保养照片作为证据
  - 支持在线/离线保存

- **TPM列表页** (`/pages/tpm-management/tpm-list`)
  - 显示历史TPM记录
  - 支持按TPM类型、设备ID和日期筛选
  - 查看详细保养记录

#### 数据流

1. 用户填写保养信息并拍照
2. 上传照片到云存储获取 `fileID`
3. 调用 `saveTpmRecord` 云函数保存记录
4. 若网络异常，支持保存到本地，待网络恢复后同步

### 5. 不合格品管理 (NP Management)

不合格品管理模块用于记录和处理生产过程中的不合格产品。

#### 页面与功能

- **不合格品录入页** (`/pages/np-management/np-entry`)
  - 记录不合格品信息
  - 选择不合格原因
  - 上传不合格品照片
  - 记录处理方式

- **不合格品列表** (`/pages/np-management/np-list`)
  - 显示历史不合格品记录
  - 支持按项目、不合格原因和日期筛选
  - 查看详细不合格品信息

#### 数据流

1. 用户填写不合格品信息并拍照
2. 上传照片到云存储获取 `fileID`
3. 调用 `saveNpRecord` 云函数保存记录

### 6. TSV管理 (Top Safety Visit)

TSV管理模块用于安全访谈和安全行为观察记录。

#### 页面与功能

- **TSV任务列表** (`/pages/tsv-management/tsv-task-list`)
  - 显示当前用户的访谈任务
  - 提供"开始访谈"入口
  - 链接到历史记录页面

- **TSV报告页** (`/pages/tsv-management/tsv-report`)
  - 记录访谈基本信息
  - 填写访谈人和被访谈人信息
  - 记录好的行为、不安全行为和状态
  - 上传相关照片

- **TSV历史列表** (`/pages/tsv-management/tsv-history-list`)
  - 显示历史TSV记录
  - 支持按月份和访谈人筛选
  - 查看详细访谈记录

- **TSV详情页** (`/pages/tsv-management/tsv-detail`)
  - 查看访谈详细信息
  - 显示访谈内容和观察结果

#### 数据流

1. 用户从任务列表选择访谈任务
2. 填写访谈信息和观察结果
3. 上传照片到云存储获取 `fileID`
4. 调用 `saveTsvReport` 云函数保存记录

### 7. 不安全行为管理 (Unsafe Management)

不安全行为管理模块用于记录和处理工作场所的不安全行为和状态。

#### 页面与功能

- **不安全行为列表** (`/pages/unsafe-management/unsafe-list`)
  - 显示历史不安全行为记录
  - 提供新增记录入口
  - 查看详细记录

- **不安全行为报告页** (`/pages/unsafe-management/unsafe-report`)
  - 记录不安全行为或状态信息
  - 选择不安全类型和严重程度
  - 上传现场照片
  - 记录处理建议

- **不安全行为详情页** (`/pages/unsafe-management/unsafe-detail`)
  - 查看不安全行为详细信息
  - 支持编辑功能

#### 数据流

1. 用户填写不安全行为信息并拍照
2. 上传照片到云存储获取 `fileID`
3. 调用 `saveUnsafeRecord` 云函数保存记录

## 辅助功能

### 1. 导航组件

- **自定义头部** (`/components/custom-header`)
  - 提供统一的页面头部样式
  - 显示页面标题

- **导航栏** (`/components/navigation-bar`)
  - 提供页面间导航功能
  - 支持返回上一级

### 2. 工具函数

- **工具类** (`/utils/util.js`)
  - 提供日期时间格式化函数
  - 通用的辅助函数

## 云函数列表

项目包含多个云函数，主要分为以下几类：

### 数据获取类

- `getDeviceList`: 获取设备列表
- `getMainInspectionPlan`: 获取主线巡检计划
- `getQuaInspectionPlan`: 获取质量巡检计划
- `getBreakdownRecords`: 获取故障记录列表
- `getTpmRecords`: 获取TPM记录列表
- `getNpRecords`: 获取不合格品记录列表
- `getTsvTasks`: 获取TSV任务列表
- `getTsvReports`: 获取TSV报告列表
- `getUnsafeRecords`: 获取不安全行为记录列表

### 数据保存类

- `saveMainPatrolRecord`: 保存主线巡检记录
- `saveQuaPatrolRecord`: 保存质量巡检记录
- `saveBreakdownRecord`: 保存故障报修记录
- `saveTpmRecord`: 保存TPM记录
- `saveNpRecord`: 保存不合格品记录
- `saveTsvReport`: 保存TSV报告
- `saveUnsafeRecord`: 保存不安全行为记录

### 数据更新类

- `updateBreakdownRecord`: 更新故障记录状态

### 数据删除类

- `deleteBreakdownRecord`: 删除故障记录
- `deleteTpmRecord`: 删除TPM记录
- `deleteNpRecord`: 删除不合格品记录
- `deleteUnsafeRecord`: 删除不安全行为记录

### 用户管理类

- `login`: 用户登录验证
- `signUp`: 用户注册
- `getPlantUsers`: 获取工厂用户列表

## 项目结构

```
digital_patrol/
├── app.js                # 小程序逻辑入口
├── app.json              # 小程序公共配置
├── app.wxss              # 小程序全局样式
├── cloudfunctions/       # 云函数目录
│   ├── get...Records/    # 数据查询函数
│   ├── save...Record/    # 数据保存函数
│   └── update...Record/  # 数据更新函数
├── components/           # 自定义组件
│   ├── custom-header/    # 自定义头部组件
│   ├── navigation-bar/   # 导航栏组件
│   └── user-info/        # 用户信息组件
├── pages/                # 小程序页面
│   ├── appearance_first/ # 外观检查第一页
│   ├── appearance_second/# 外观检查第二页
│   ├── asm/              # 组装检查页面
│   ├── breakdown-management/ # 故障管理模块
│   ├── cookie_number/    # Cookie编号输入页
│   ├── fc/               # 功能检查页面
│   ├── index/            # 首页
│   ├── login/            # 登录页面
│   ├── main-patrol/      # 主线巡检页面
│   ├── main-patrol-detail/ # 主线巡检详情页
│   ├── main-patrol-list/ # 主线巡检列表页
│   ├── np-management/    # 不合格品管理模块
│   ├── qua-patrol/       # 质量巡检页面
│   ├── qua-patrol-list/  # 质量巡检列表页
│   ├── register/         # 注册页面
│   ├── special/          # 特殊检查页面
│   ├── summary/          # 巡检总结页面
│   ├── thickness/        # 厚度检查页面
│   ├── tpm-management/   # TPM管理模块
│   ├── tsv-management/   # TSV管理模块
│   └── unsafe-management/# 不安全行为管理模块
└── utils/                # 工具函数
    └── util.js           # 通用工具函数
```

## 未来展望

- **数据可视化看板**: 在 `summary` 页面增加图表，对故障率、巡检合格率等核心KPI进行可视化分析
- **权限管理系统**: 引入角色概念（管理员、巡检员、维修工），不同角色拥有不同的菜单和操作权限
- **消息推送**: 当故障记录状态变更时，通过小程序订阅消息推送给下一环节负责人
- **离线工作模式**: 增强离线数据存储和同步功能，支持网络不稳定环境下的使用
- **数据导出**: 支持将巡检数据导出为Excel或PDF格式，便于报表生成
- **多语言支持**: 增加英文等多语言界面，支持国际化工厂使用