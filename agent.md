### 项目概述
这是一个名为 “Smart Autofill Assistant” 的 Chrome 扩展程序，旨在利用 AI 模型智能识别并填充网页表单。它作为 Manifest V3 扩展构建，通过侧边栏界面与用户交互，提供由 AI 驱动的表单分析和自动填充功能。

### 架构
该扩展采用模块化架构，各组件职责分明：
- **后台服务工作线程 (`src/background/service-worker.js`)**: 负责处理对 AI API 的调用、管理数据，并协调内容脚本和侧边栏之间的通信。
- **内容脚本 (`src/content/content-script.js`)**: 分析网页上的表单，并执行实际的表单填写操作。
- **侧边栏界面 (`src/sidebar/`)**: 为用户提供管理个人信息、设置和监控状态的用户界面。
- **共享工具 (`src/shared/`)**: 包含跨组件使用的通用常量和实用程序。

### 文件结构约定
```
.
├── src/
│   ├── background/
│   │   └── service-worker.js
│   ├── content/
│   │   └── content-script.js
│   ├── sidebar/
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.js
│   ├── shared/
│   │   ├── constants.js
│   │   └── utils.js
│   └── assets/
│       └── icons/
├── dist/
├── doc/
├── prototype/
├── test/
├── manifest.json
├── package.json
└── README.md
```

### 关键技术细节
- **AI 集成**:
  - 主要模型为 Google Gemini Flash-Lite 2.5。
  - 支持多种 AI 提供商：本地模型、Gemini、OpenAI 和 Claude。
  - API 端点和模型配置在 `src/shared/constants.js` 中定义。
- **数据存储**:
  - 使用 Chrome Storage API 进行本地数据持久化。
  - 存储用户个人信息、设置和分析缓存，注重隐私保护。
- **消息传递**:
  - 在后台、内容脚本和侧边栏之间建立了广泛的消息传递系统。

### 开发命令
- **安装依赖**:
  ```bash
  npm install
  ```
- **构建项目**:
  ```bash
  npm run build
  ```
- **运行测试**:
  ```bash
  npm run test
  ```
- **启动开发服务器**:
  ```bash
  npm run dev
  ```
- **代码检查**:
  ```bash
  npm run lint
  ```

### 构建与测试
- 使用 `node build.js` 命令在 `dist/` 目录下创建生产版本。
- 在 Chrome 开发者模式下，以“加载已解压的扩展程序”方式加载 `dist/` 目录进行测试。
- 测试页面位于 `test/` 目录下。

### 其他重要信息
- **扩展权限**: 需要 `activeTab`、`storage`、`sidePanel`、`scripting` 和 `tabs` 权限。
- **AI 模型配置**:
  - 本地 Flash-Lite 模型无需 API 密钥。
  - Google Gemini、OpenAI 和 Claude 需要各自的 API 密钥。
- **开发模式**:
  - 使用 `MESSAGE_TYPES` 常量进行组件间通信。
  - 遵循 `SEMANTIC_LABELS` 中定义的语义化字段标签系统。
