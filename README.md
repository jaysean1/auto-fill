# Smart Autofill Assistant

Smart Autofill Assistant - An AI-powered browser extension that intelligently recognizes web forms and automatically fills in user information.

## 🚀 Features

- 🧠 Intelligent Form Recognition: Uses AI models to analyze page structure and identify the semantic meaning of form fields.
- ✍️ Natural Language Configuration: Users can describe their personal information in natural language, without structured input.
- 🤖 Multi-Model Support: Supports local Flash-Lite models and remote AI services (Gemini, OpenAI, Claude).
- 🔒 Privacy Protection: All user data is stored locally and is not uploaded to the server.
- 🎯 Intelligent Matching: Matches user information to form fields based on semantic understanding.
- ✨ Visual Feedback: Provides real-time status and result feedback during the filling process.



## 📋 系统要求

- Chrome 浏览器 88+ 或其他支持 Manifest V3 的浏览器
- 网络连接（使用远程AI模型时）

## 🛠️ 安装方法

### 开发者模式安装

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录
6. 插件安装完成

### 从Chrome商店安装（即将上线）

插件正在审核中，即将在Chrome Web Store上线。

## 📖 使用指南

### 1. 配置个人信息

1. 点击浏览器工具栏中的插件图标
2. 在侧边栏中选择"Profiles"标签
3. 点击"Add Profile"添加新的个人信息配置
4. 输入配置名称和个人信息（支持自然语言描述）

**示例配置：**
```
名称: jaysean
信息: 我叫千岁，英文名是jaysean 出生于1989/07/31 邮箱jaysean.qian@gmail.com
```

### 2. 配置AI模型

1. 在侧边栏中选择"Settings"标签
2. 选择AI模型提供商：
   - **Local Flash-Lite**: 本地模型，无需API密钥
   - **Google Gemini**: 需要Gemini API密钥
   - **OpenAI GPT**: 需要OpenAI API密钥
   - **Anthropic Claude**: 需要Claude API密钥
3. 如使用远程模型，请输入相应的API密钥
4. 点击"Save Settings"保存配置

### 3. 自动填写表单

1. 访问包含表单的网页
2. 点击插件图标打开侧边栏
3. 在"Profiles"标签中选择要使用的个人信息配置
4. 点击"Start Autofill"开始自动填写
5. 在"Status"标签中查看填写进度和结果

## 🔧 技术架构

### 核心组件

- **Background Service Worker**: 处理AI模型调用和数据管理
- **Content Script**: 页面分析和表单填写
- **Sidebar Interface**: 用户交互界面
- **Shared Utilities**: 通用工具和常量

### 技术栈

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **浏览器API**: Chrome Extension Manifest V3
- **AI集成**: Google Gemini Flash-Lite 2.5
- **存储**: Chrome Storage API (localStorage)
- **架构**: 模块化设计，支持多AI模型

### 项目结构

```
smart-autofill-assistant/
├── manifest.json                 # 插件配置文件
├── src/
│   ├── background/              # 后台脚本
│   │   └── service-worker.js
│   ├── content/                 # 内容脚本
│   │   └── content-script.js
│   ├── sidebar/                 # 侧边栏界面
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.js
│   ├── shared/                  # 共享模块
│   │   ├── utils.js
│   │   └── constants.js
│   └── assets/                  # 静态资源
│       └── icons/
├── prototype/                   # 设计原型
├── doc/                        # 项目文档
└── README.md
```

## 🔒 隐私与安全

- **本地存储**: 所有用户数据存储在浏览器本地，不上传到任何服务器
- **API密钥安全**: API密钥仅存储在本地，仅用于与选定的AI服务通信
- **权限最小化**: 插件仅请求必要的浏览器权限
- **数据加密**: 敏感数据在存储前进行加密处理

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 开发环境设置

1. 克隆项目：`git clone [repository-url]`
2. 在Chrome中加载插件进行测试
3. 修改代码后重新加载插件

### 提交规范

- 使用清晰的提交信息
- 遵循现有的代码风格
- 添加必要的测试和文档

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 支持基本的表单识别和自动填写
- 集成Google Gemini Flash-Lite 2.5模型
- 实现用户信息管理和设置配置

## 🐛 问题反馈

如果您遇到问题或有建议，请通过以下方式联系：

- GitHub Issues: [项目Issues页面]
- 邮箱: [联系邮箱]

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- Google Gemini团队提供的优秀AI模型
- Chrome Extensions团队提供的强大平台
- 所有贡献者和测试用户的支持

---

**注意**: 本插件仍在开发中，部分功能可能不够稳定。建议在重要表单中谨慎使用，并始终检查自动填写的内容。