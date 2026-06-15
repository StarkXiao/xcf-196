# 🌙 月光约定簿

> 一款治愈向的双人约定打卡应用，记录你们的每一个温柔约定

## ✨ 项目简介

月光约定簿是一个专为情侣/亲密关系设计的温馨应用，帮助你们记录约定、坚持打卡、
回顾关系轨迹，让每一份承诺都像月光一样温柔绵长。

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript** - 类型安全的组件化开发
- **Vite** - 快速的前端构建工具
- **React Router** - 前端路由管理
- **Axios** - HTTP 请求库

### 后端
- **NestJS** - 企业级 Node.js 框架
- **TypeScript** - 类型安全的后端开发
- **Class Validator** - 参数验证
- **UUID** - 唯一标识符生成

## 📁 项目结构

```
moonlight-pact/
├── server/                    # 后端服务
│   ├── src/
│   │   ├── main.ts            # 入口文件
│   │   ├── app.module.ts      # 根模块
│   │   ├── data/
│   │   │   └── seed.ts        # 示例数据
│   │   ├── pacts/             # 约定管理模块
│   │   ├── checkins/          # 打卡记录模块
│   │   ├── timeline/          # 时间线模块
│   │   ├── reminders/         # 提醒面板模块
│   │   └── users/             # 用户设置模块
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
└── client/                    # 前端应用
    ├── src/
    │   ├── main.tsx           # 入口文件
    │   ├── App.tsx            # 根组件
    │   ├── types/             # 类型定义
    │   ├── services/          # API 服务
    │   ├── components/        # 通用组件
    │   ├── pages/             # 页面组件
    │   │   ├── Dashboard.tsx  # 首页仪表盘
    │   │   ├── Pacts.tsx      # 约定管理
    │   │   ├── Checkins.tsx   # 打卡记录
    │   │   ├── Timeline.tsx   # 时间线
    │   │   ├── Reminders.tsx  # 提醒面板
    │   │   └── Settings.tsx   # 用户设置
    │   └── styles/
    │       └── global.css     # 全局样式
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.x
- npm 或 yarn

### 一键启动

```bash
# 1. 进入后端目录，安装依赖并启动
cd server
npm install
npm run start:dev

# 2. 新开一个终端，进入前端目录，安装依赖并启动
cd client
npm install
npm run dev
```

### 访问地址
- 前端应用: http://localhost:5173 (Vite会自动选择可用端口)
- 后端 API: http://localhost:4000

## 🎯 功能模块

### 1. 约定管理 (Pacts)
- 创建、编辑、删除约定
- 约定分类：每日、每周、每月、特别约定
- 约定状态：进行中、已暂停、已完成
- 连续打卡天数统计
- 自定义图标和颜色

### 2. 打卡记录 (Checkins)
- 记录每日打卡
- 心情选择：开心、平静、疲惫、兴奋、感恩
- 打卡方式：我打卡、TA打卡、一起打卡
- 打卡心得记录
- 按约定筛选打卡记录
- 打卡数据统计

### 3. 时间线 (Timeline)
- 记录关系中的重要时刻
- 事件类型：新约定、完成约定、打卡、里程碑、纪念日
- 按年份分组展示
- 可按类型筛选

### 4. 提醒面板 (Reminders)
- 创建自定义提醒
- 提醒类型：约定提醒、纪念日、自定义
- 重复设置：不重复、每天、每周、每月、每年
- 一键启用/停用提醒
- 关联约定的提醒

### 5. 用户设置 (Settings)
- 个人信息设置（昵称、头像）
- 伴侣信息设置
- 纪念日设置
- 个性签名
- 主题切换（月光紫、日落橙、海洋蓝、森林绿）
- 通知设置

## 🌟 示例数据

应用内置了丰富的示例数据，包括：
- 5 个示例约定（每天说晚安、每周一起做饭、每月一次约会等）
- 多条打卡记录
- 6 个时间线事件
- 4 个提醒设置
- 预设的用户信息和纪念日

打开应用即可体验完整功能！

## 🎨 主题预览

### 月光紫 (默认)
深邃的紫色夜空，如月光般温柔

### 日落橙
温暖的橙色调，像日落一样浪漫

### 海洋蓝
清新的蓝色系，如海洋般宁静

### 森林绿
自然的绿色调，充满生机与希望

## 📚 API 接口

### 约定管理
- `GET /api/pacts` - 获取约定列表
- `GET /api/pacts/:id` - 获取单个约定
- `POST /api/pacts` - 创建约定
- `PATCH /api/pacts/:id` - 更新约定
- `DELETE /api/pacts/:id` - 删除约定
- `GET /api/pacts/stats` - 获取约定统计

### 打卡记录
- `GET /api/checkins` - 获取打卡列表
- `GET /api/checkins/:id` - 获取单个打卡
- `POST /api/checkins` - 创建打卡
- `DELETE /api/checkins/:id` - 删除打卡
- `GET /api/checkins/stats` - 获取打卡统计

### 时间线
- `GET /api/timeline` - 获取时间线事件
- `GET /api/timeline/:id` - 获取单个事件

### 提醒面板
- `GET /api/reminders` - 获取提醒列表
- `GET /api/reminders/:id` - 获取单个提醒
- `POST /api/reminders` - 创建提醒
- `PATCH /api/reminders/:id` - 更新提醒
- `PATCH /api/reminders/:id/toggle` - 切换提醒状态
- `DELETE /api/reminders/:id` - 删除提醒

### 用户设置
- `GET /api/users/profile` - 获取用户信息
- `PATCH /api/users/profile` - 更新用户信息
- `GET /api/users/anniversary` - 获取纪念日信息

## 💝 设计理念

- **治愈向设计**：柔和的配色、圆润的卡片、星星背景
- **情感化表达**：emoji 图标、温柔的文案、心情记录
- **仪式感**：纪念日提醒、连续打卡奖励、时间线回顾
- **陪伴感**：双人视角、一起打卡、共同成长

## 📝 License

MIT

---

💫 愿每一个约定，都能温柔地实现
