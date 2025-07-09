# 数字巡检小程序 | Digital Patrol Mini-Program

## 项目概述 | Project Overview

数字巡检是一款专为现代化生产车间打造的微信小程序，旨在革新传统纸质巡检和报修流程。通过将业务流程数字化、移动化，构建一个透明、高效、可追溯的线上协作平台。

The Digital Patrol is a WeChat Mini-Program designed for modern production workshops, aiming to revolutionize traditional paper-based inspection and repair processes. By digitalizing and mobilizing business workflows, it builds a transparent, efficient, and traceable online collaboration platform.

### 核心目标 | Core Objectives

- **无纸化办公 | Paperless Office**：消除纸质记录的填写、传递和归档成本
  Eliminate the costs of filling out, transferring, and archiving paper records
  
- **提升效率 | Improve Efficiency**：巡检员和工程师可随时随地通过手机完成任务，数据实时同步
  Inspectors and engineers can complete tasks anytime, anywhere via mobile phones with real-time data synchronization
  
- **强化数据追溯 | Enhance Data Traceability**：所有操作均有时间戳和责任人记录，为质量分析和管理决策提供可靠数据基础
  All operations are recorded with timestamps and responsible persons, providing reliable data foundation for quality analysis and management decisions
  
- **优化协作流程 | Optimize Collaboration Process**：打通生产、维修、质量部门间的信息壁垒，加速故障响应和处理速度
  Break down information barriers between production, maintenance, and quality departments to accelerate fault response and processing speed

## 技术架构 | Technical Architecture

- **前端 | Frontend**：微信小程序原生框架 (WXML, WXSS, JS, WXS)
  WeChat Mini-Program native framework (WXML, WXSS, JS, WXS)
  
- **后端 | Backend**：微信云开发 (Tencent Cloud Base)
  WeChat Cloud Development (Tencent Cloud Base)
  - **云函数 | Cloud Functions**：使用 Node.js 编写，承载所有后端业务逻辑
    Written in Node.js, carrying all backend business logic
  - **云数据库 | Cloud Database**：基于 MongoDB 的 NoSQL 文档数据库
    MongoDB-based NoSQL document database
  - **云存储 | Cloud Storage**：存储用户上传的图片文件，通过 `fileID` 与数据库记录关联
    Store user-uploaded image files, associated with database records via `fileID`

## 用户系统 | User System

### 登录与注册 | Login and Registration

- **登录页面 | Login Page** (`/pages/login/login`)
  - 用户输入账号和密码进行身份验证
    Users input account and password for authentication
  - 登录信息存储在本地缓存，便于后续使用
    Login information is stored in local cache for subsequent use

- **注册页面 | Registration Page** (`/pages/register/register`)
  - 新用户注册，填写基本信息
    New users register and fill in basic information
  - 通过 `signUp` 云函数创建新用户
    Create new users through the `signUp` cloud function

### 用户信息组件 | User Information Component

- **用户信息组件 | User Info Component** (`/components/user-info`)
  - 显示当前登录用户的信息
    Display current logged-in user's information
  - 提供登出功能
    Provide logout functionality

## 核心功能模块 | Core Function Modules

### 1. 主线巡检 (维修巡检) | Main Patrol (Maintenance Inspection)

主线巡检模块用于执行设备的常规巡检任务，确保设备正常运行。

The Main Patrol module is used for executing routine equipment inspection tasks to ensure normal equipment operation.

#### 页面与功能 | Pages and Functions

- **主线巡检列表 | Main Patrol List** (`/pages/main-patrol-list/main-patrol-list`)
  - 显示最近的巡检记录
    Display recent inspection records
  - 支持查看历史巡检数据
    Support viewing historical inspection data
  - 提供"开始巡检"入口
    Provide "Start Inspection" entry

- **主线巡检执行页 | Main Patrol Execution Page** (`/pages/main-patrol/main-patrol`)
  - 通过扫码识别设备
    Identify equipment through scanning codes
  - 显示设备基本信息
    Display basic equipment information
  - 根据预设的巡检项目列表执行检查
    Perform inspections based on preset inspection item lists
  - 支持异常项拍照上传和描述记录
    Support abnormal item photo uploading and description recording

- **巡检详情页 | Inspection Detail Page** (`/pages/main-patrol-detail/main-patrol-detail`)
  - 查看已完成巡检的详细信息
    View detailed information of completed inspections
  - 显示巡检项目及结果
    Display inspection items and results
  - 查看异常项的照片和描述
    View photos and descriptions of abnormal items

#### 数据流 | Data Flow

1. 用户扫描设备二维码或手动输入设备ID
   User scans equipment QR code or manually inputs equipment ID
2. 系统调用 `getMainInspectionPlan` 云函数获取该设备的巡检计划
   System calls `getMainInspectionPlan` cloud function to get the inspection plan for the equipment
3. 用户完成巡检项目检查，记录异常情况
   User completes inspection items check and records abnormal situations
4. 提交时调用 `saveMainPatrolRecord` 云函数保存记录
   Call `saveMainPatrolRecord` cloud function to save the record when submitting

### 2. 质量巡检 | Quality Patrol (QUA)

质量巡检模块用于执行产品或产线的质量抽检任务。

The Quality Patrol module is used for executing quality sampling inspection tasks for products or production lines.

#### 页面与功能 | Pages and Functions

- **质量巡检页面 | Quality Patrol Page** (`/pages/qua-patrol/qua-patrol`)
  - 选择项目、过程和班次
    Select project, process, and shift
  - 显示巡检项目列表
    Display inspection item list
  - 支持拍照记录和结果输入
    Support photo recording and result input

- **质量巡检列表 | Quality Patrol List** (`/pages/qua-patrol-list/qua-patrol-list`)
  - 显示历史质量巡检记录
    Display historical quality inspection records
  - 支持按项目、产线、检查员和日期范围筛选
    Support filtering by project, production line, inspector, and date range

- **外观检查页面 | Appearance Inspection Pages** (`/pages/appearance_first/appearance_first`, `/pages/appearance_second/appearance_second`)
  - 专门用于产品外观检查
    Specifically for product appearance inspection
  - 分页显示检查项目
    Display inspection items by pages
  - 支持OK/NG状态选择和照片上传
    Support OK/NG status selection and photo uploading

#### 数据流 | Data Flow

1. 用户选择巡检项目和过程
   User selects inspection project and process
2. 系统调用 `getQuaInspectionPlan` 云函数获取巡检计划
   System calls `getQuaInspectionPlan` cloud function to get the inspection plan
3. 用户完成巡检项目检查，记录结果和拍照
   User completes inspection items check, records results and takes photos
4. 提交时先上传图片到云存储，获取 `fileID`
   First upload images to cloud storage to get `fileID` when submitting
5. 调用 `saveQuaPatrolRecord` 云函数保存完整记录
   Call `saveQuaPatrolRecord` cloud function to save the complete record

### 3. 故障报修管理 | Breakdown Management

故障报修模块实现了从"发现故障"到"解决问题"的闭环工作流，基于状态机的流转机制。

The Breakdown Management module implements a closed-loop workflow from "fault discovery" to "problem resolution" based on a state machine transition mechanism.

#### 页面与功能 | Pages and Functions

- **故障报修列表 | Breakdown List** (`/pages/breakdown-management/breakdown-list`)
  - 显示所有故障报修记录
    Display all breakdown repair records
  - 按状态分类：待维修、待质检、已完成
    Categorize by status: pending repair, pending quality check, completed
  - 提供新增报修入口
    Provide new repair entry

- **生产报修页 | Production Repair Page** (`/pages/breakdown-management/breakdown-production`)
  - 填写故障设备、问题描述
    Fill in faulty equipment and problem description
  - 上传故障现场照片
    Upload fault scene photos
  - 创建初始状态为"待维修"的记录
    Create records with initial status "pending repair"

- **设备维修页 | Equipment Repair Page** (`/pages/breakdown-management/breakdown-repair`)
  - 维修人员填写维修措施、故障原因
    Maintenance personnel fill in repair measures and fault causes
  - 记录维修时间和维修人员
    Record repair time and maintenance personnel
  - 将状态更新为"待质检"
    Update status to "pending quality check"

- **质量验证页 | Quality Verification Page** (`/pages/breakdown-management/breakdown-quality`)
  - 质量人员验证维修结果
    Quality personnel verify repair results
  - 填写验证信息
    Fill in verification information
  - 将状态更新为"已完成"
    Update status to "completed"

#### 数据流与状态转换 | Data Flow and Status Transition

| 状态 State | 含义 Meaning | 触发页面 Trigger Page | 下一状态 Next State |
|------|------|---------|---------|
| `pending` | 待维修 Pending Repair | `breakdown-production` | `repaired` |
| `repaired` | 待质检 Pending Quality Check | `breakdown-repair` | `completed` |
| `completed` | 已完成 Completed | `breakdown-quality` | (最终态 Final State) |

1. 生产报修：调用 `saveBreakdownRecord` 云函数创建记录
   Production repair: Call `saveBreakdownRecord` cloud function to create record
2. 设备维修：调用 `updateBreakdownRecord` 云函数更新状态
   Equipment repair: Call `updateBreakdownRecord` cloud function to update status
3. 质量验证：再次调用 `updateBreakdownRecord` 云函数完成流程
   Quality verification: Call `updateBreakdownRecord` cloud function again to complete the process

### 4. TPM管理 (预防性维修) | Total Productive Maintenance

TPM管理模块用于记录设备的预防性维护和保养工作。

The TPM management module is used to record preventive maintenance and care work for equipment.

#### 页面与功能 | Pages and Functions

- **TPM记录页 | TPM Record Page** (`/pages/tpm-management/tpm-record`)
  - 选择设备类型和具体设备
    Select equipment type and specific equipment
  - 记录保养时间和保养人
    Record maintenance time and maintenance personnel
  - 上传保养照片作为证据
    Upload maintenance photos as evidence
  - 支持在线/离线保存
    Support online/offline saving

- **TPM列表页 | TPM List Page** (`/pages/tpm-management/tpm-list`)
  - 显示历史TPM记录
    Display historical TPM records
  - 支持按TPM类型、设备ID和日期筛选
    Support filtering by TPM type, equipment ID, and date
  - 查看详细保养记录
    View detailed maintenance records

#### 数据流 | Data Flow

1. 用户填写保养信息并拍照
   User fills in maintenance information and takes photos
2. 上传照片到云存储获取 `fileID`
   Upload photos to cloud storage to get `fileID`
3. 调用 `saveTpmRecord` 云函数保存记录
   Call `saveTpmRecord` cloud function to save the record
4. 若网络异常，支持保存到本地，待网络恢复后同步
   If network exception occurs, support saving locally and synchronizing when network recovers

### 5. 不合格品管理 | Non-conforming Product (NP) Management

不合格品管理模块用于记录和处理生产过程中的不合格产品。

The Non-conforming Product Management module is used to record and process non-conforming products in the production process.

#### 页面与功能 | Pages and Functions

- **不合格品录入页 | NP Entry Page** (`/pages/np-management/np-entry`)
  - 记录不合格品信息
    Record non-conforming product information
  - 选择不合格原因
    Select non-conforming reasons
  - 上传不合格品照片
    Upload non-conforming product photos
  - 记录处理方式
    Record processing methods

- **不合格品列表 | NP List** (`/pages/np-management/np-list`)
  - 显示历史不合格品记录
    Display historical non-conforming product records
  - 支持按项目、不合格原因和日期筛选
    Support filtering by project, non-conforming reason, and date
  - 查看详细不合格品信息
    View detailed non-conforming product information

#### 数据流 | Data Flow

1. 用户填写不合格品信息并拍照
   User fills in non-conforming product information and takes photos
2. 上传照片到云存储获取 `fileID`
   Upload photos to cloud storage to get `fileID`
3. 调用 `saveNpRecord` 云函数保存记录
   Call `saveNpRecord` cloud function to save the record

### 6. TSV管理 (安全访谈) | Top Safety Visit Management

TSV管理模块用于安全访谈和安全行为观察记录。

The TSV management module is used for safety interviews and safety behavior observation records.

#### 页面与功能 | Pages and Functions

- **TSV任务列表 | TSV Task List** (`/pages/tsv-management/tsv-task-list`)
  - 显示当前用户的访谈任务
    Display current user's interview tasks
  - 提供"开始访谈"入口
    Provide "Start Interview" entry
  - 链接到历史记录页面
    Link to history record page

- **TSV报告页 | TSV Report Page** (`/pages/tsv-management/tsv-report`)
  - 记录访谈基本信息
    Record basic interview information
  - 填写访谈人和被访谈人信息
    Fill in interviewer and interviewee information
  - 记录好的行为、不安全行为和状态
    Record good behaviors, unsafe behaviors, and status
  - 上传相关照片
    Upload relevant photos

- **TSV历史列表 | TSV History List** (`/pages/tsv-management/tsv-history-list`)
  - 显示历史TSV记录
    Display historical TSV records
  - 支持按月份和访谈人筛选
    Support filtering by month and interviewer
  - 查看详细访谈记录
    View detailed interview records

- **TSV详情页 | TSV Detail Page** (`/pages/tsv-management/tsv-detail`)
  - 查看访谈详细信息
    View detailed interview information
  - 显示访谈内容和观察结果
    Display interview content and observation results

#### 数据流 | Data Flow

1. 用户从任务列表选择访谈任务
   User selects interview task from task list
2. 填写访谈信息和观察结果
   Fill in interview information and observation results
3. 上传照片到云存储获取 `fileID`
   Upload photos to cloud storage to get `fileID`
4. 调用 `saveTsvReport` 云函数保存记录
   Call `saveTsvReport` cloud function to save the record

### 7. 不安全行为管理 | Unsafe Behavior Management

不安全行为管理模块用于记录和处理工作场所的不安全行为和状态。

The Unsafe Behavior Management module is used to record and process unsafe behaviors and conditions in the workplace.

#### 页面与功能 | Pages and Functions

- **不安全行为列表 | Unsafe Behavior List** (`/pages/unsafe-management/unsafe-list`)
  - 显示历史不安全行为记录
    Display historical unsafe behavior records
  - 提供新增记录入口
    Provide new record entry
  - 查看详细记录
    View detailed records

- **不安全行为报告页 | Unsafe Behavior Report Page** (`/pages/unsafe-management/unsafe-report`)
  - 记录不安全行为或状态信息
    Record unsafe behavior or condition information
  - 选择不安全类型和严重程度
    Select unsafe type and severity
  - 上传现场照片
    Upload scene photos
  - 记录处理建议
    Record processing suggestions

- **不安全行为详情页 | Unsafe Behavior Detail Page** (`/pages/unsafe-management/unsafe-detail`)
  - 查看不安全行为详细信息
    View detailed unsafe behavior information
  - 支持编辑功能
    Support editing function

#### 数据流 | Data Flow

1. 用户填写不安全行为信息并拍照
   User fills in unsafe behavior information and takes photos
2. 上传照片到云存储获取 `fileID`
   Upload photos to cloud storage to get `fileID`
3. 调用 `saveUnsafeRecord` 云函数保存记录
   Call `saveUnsafeRecord` cloud function to save the record

## 辅助功能 | Auxiliary Functions

### 1. 导航组件 | Navigation Components

- **自定义头部 | Custom Header** (`/components/custom-header`)
  - 提供统一的页面头部样式
    Provide unified page header style
  - 显示页面标题
    Display page title

- **导航栏 | Navigation Bar** (`/components/navigation-bar`)
  - 提供页面间导航功能
    Provide navigation function between pages
  - 支持返回上一级
    Support returning to the previous level

### 2. 工具函数 | Utility Functions

- **工具类 | Utility Class** (`/utils/util.js`)
  - 提供日期时间格式化函数
    Provide date and time formatting functions
  - 通用的辅助函数
    General auxiliary functions

## 云函数列表 | Cloud Function List

项目包含多个云函数，主要分为以下几类：

The project contains multiple cloud functions, mainly divided into the following categories:

### 数据获取类 | Data Retrieval Functions

- `getDeviceList`: 获取设备列表 | Get device list
- `getMainInspectionPlan`: 获取主线巡检计划 | Get main inspection plan
- `getQuaInspectionPlan`: 获取质量巡检计划 | Get quality inspection plan
- `getBreakdownRecords`: 获取故障记录列表 | Get breakdown records list
- `getTpmRecords`: 获取TPM记录列表 | Get TPM records list
- `getNpRecords`: 获取不合格品记录列表 | Get non-conforming product records list
- `getTsvTasks`: 获取TSV任务列表 | Get TSV task list
- `getTsvReports`: 获取TSV报告列表 | Get TSV report list
- `getUnsafeRecords`: 获取不安全行为记录列表 | Get unsafe behavior records list

### 数据保存类 | Data Saving Functions

- `saveMainPatrolRecord`: 保存主线巡检记录 | Save main patrol record
- `saveQuaPatrolRecord`: 保存质量巡检记录 | Save quality patrol record
- `saveBreakdownRecord`: 保存故障报修记录 | Save breakdown record
- `saveTpmRecord`: 保存TPM记录 | Save TPM record
- `saveNpRecord`: 保存不合格品记录 | Save non-conforming product record
- `saveTsvReport`: 保存TSV报告 | Save TSV report
- `saveUnsafeRecord`: 保存不安全行为记录 | Save unsafe behavior record

### 数据更新类 | Data Update Functions

- `updateBreakdownRecord`: 更新故障记录状态 | Update breakdown record status

### 数据删除类 | Data Deletion Functions

- `deleteBreakdownRecord`: 删除故障记录 | Delete breakdown record
- `deleteTpmRecord`: 删除TPM记录 | Delete TPM record
- `deleteNpRecord`: 删除不合格品记录 | Delete non-conforming product record
- `deleteUnsafeRecord`: 删除不安全行为记录 | Delete unsafe behavior record

### 用户管理类 | User Management Functions

- `login`: 用户登录验证 | User login verification
- `signUp`: 用户注册 | User registration
- `getPlantUsers`: 获取工厂用户列表 | Get plant user list

## 项目结构 | Project Structure

```
digital_patrol/
├── app.js                # 小程序逻辑入口 | Mini-program logic entry
├── app.json              # 小程序公共配置 | Mini-program common configuration
├── app.wxss              # 小程序全局样式 | Mini-program global style
├── cloudfunctions/       # 云函数目录 | Cloud function directory
│   ├── get...Records/    # 数据查询函数 | Data query functions
│   ├── save...Record/    # 数据保存函数 | Data saving functions
│   └── update...Record/  # 数据更新函数 | Data update functions
├── components/           # 自定义组件 | Custom components
│   ├── custom-header/    # 自定义头部组件 | Custom header component
│   ├── navigation-bar/   # 导航栏组件 | Navigation bar component
│   └── user-info/        # 用户信息组件 | User info component
├── pages/                # 小程序页面 | Mini-program pages
│   ├── appearance_first/ # 外观检查第一页 | Appearance check first page
│   ├── appearance_second/# 外观检查第二页 | Appearance check second page
│   ├── asm/              # 组装检查页面 | Assembly check page
│   ├── breakdown-management/ # 故障管理模块 | Breakdown management module
│   ├── cookie_number/    # Cookie编号输入页 | Cookie number input page
│   ├── fc/               # 功能检查页面 | Function check page
│   ├── index/            # 首页 | Home page
│   ├── login/            # 登录页面 | Login page
│   ├── main-patrol/      # 主线巡检页面 | Main patrol page
│   ├── main-patrol-detail/ # 主线巡检详情页 | Main patrol detail page
│   ├── main-patrol-list/ # 主线巡检列表页 | Main patrol list page
│   ├── np-management/    # 不合格品管理模块 | Non-conforming product management module
│   ├── qua-patrol/       # 质量巡检页面 | Quality patrol page
│   ├── qua-patrol-list/  # 质量巡检列表页 | Quality patrol list page
│   ├── register/         # 注册页面 | Registration page
│   ├── special/          # 特殊检查页面 | Special check page
│   ├── summary/          # 巡检总结页面 | Patrol summary page
│   ├── thickness/        # 厚度检查页面 | Thickness check page
│   ├── tpm-management/   # TPM管理模块 | TPM management module
│   ├── tsv-management/   # TSV管理模块 | TSV management module
│   └── unsafe-management/# 不安全行为管理模块 | Unsafe behavior management module
└── utils/                # 工具函数 | Utility functions
    └── util.js           # 通用工具函数 | Common utility functions
```

## 未来展望 | Future Prospects

- **数据可视化看板 | Data Visualization Dashboard**: 在 `summary` 页面增加图表，对故障率、巡检合格率等核心KPI进行可视化分析
  Add charts to the `summary` page for visual analysis of core KPIs such as failure rate and inspection pass rate
  
- **权限管理系统 | Permission Management System**: 引入角色概念（管理员、巡检员、维修工），不同角色拥有不同的菜单和操作权限
  Introduce role concepts (administrator, inspector, maintenance worker), different roles have different menu and operation permissions
  
- **消息推送 | Message Push**: 当故障记录状态变更时，通过小程序订阅消息推送给下一环节负责人
  When the status of fault records changes, push messages to the next process responsible person through mini-program subscription messages
  
- **离线工作模式 | Offline Working Mode**: 增强离线数据存储和同步功能，支持网络不稳定环境下的使用
  Enhance offline data storage and synchronization functions to support use in unstable network environments
  
- **数据导出 | Data Export**: 支持将巡检数据导出为Excel或PDF格式，便于报表生成
  Support exporting inspection data to Excel or PDF format for easy report generation
  
- **多语言支持 | Multi-language Support**: 增加英文等多语言界面，支持国际化工厂使用
  Add multi-language interfaces such as English to support internationalized factory use