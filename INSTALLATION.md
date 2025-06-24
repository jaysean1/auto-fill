# Smart Autofill Assistant 安装指南

## 📦 安装方法

### 方法一：开发者模式安装（推荐）

1. **下载项目文件**
   ```bash
   git clone [repository-url]
   cd smart-autofill-assistant
   ```

2. **构建扩展包**（可选）
   ```bash
   node build.js
   ```
   这将在 `dist/` 目录中创建一个干净的扩展包。

3. **在Chrome中加载扩展**
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"开关
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录（或 `dist/` 目录，如果您运行了构建脚本）
   - 扩展将自动加载并出现在扩展列表中

4. **验证安装**
   - 在工具栏中应该能看到Smart Autofill Assistant图标
   - 点击图标应该能打开侧边栏界面

### 方法二：从Chrome Web Store安装（即将推出）

扩展正在提交到Chrome Web Store，审核通过后可直接安装。

## 🔧 初始配置

### 1. 配置AI模型

首次使用需要配置AI模型：

1. 点击扩展图标打开侧边栏
2. 切换到"Settings"标签
3. 选择AI模型提供商：

#### 本地模型（推荐新手）
- 选择"Local Flash-Lite"
- 无需API密钥，即可使用
- 功能相对简单，但足够日常使用

#### 远程模型（高级用户）
- **Google Gemini**: 
  - 获取API密钥：访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
  - 创建新的API密钥并复制
  - 在设置中粘贴API密钥

- **OpenAI GPT**:
  - 获取API密钥：访问 [OpenAI API Keys](https://platform.openai.com/api-keys)
  - 创建新的API密钥并复制
  - 在设置中粘贴API密钥

- **Anthropic Claude**:
  - 获取API密钥：访问 [Anthropic Console](https://console.anthropic.com/)
  - 创建新的API密钥并复制
  - 在设置中粘贴API密钥

4. 点击"Save Settings"保存配置

### 2. 创建个人信息配置

1. 切换到"Profiles"标签
2. 点击"Add Profile"按钮
3. 填写配置信息：

**示例配置1（个人信息）：**
```
名称: 个人资料
信息: 我叫张三，英文名是John Zhang，出生于1990年5月15日，邮箱是john.zhang@email.com，手机号码是13812345678，住址是北京市朝阳区某某街道123号
```

**示例配置2（工作信息）：**
```
名称: 工作资料  
信息: 我在ABC科技公司工作，职位是软件工程师，公司邮箱是john.zhang@abc-tech.com，办公地址是上海市浦东新区科技园区456号
```

**示例配置3（英文信息）：**
```
名称: English Profile
信息: My name is John Zhang, born on May 15, 1990, email john.zhang@email.com, phone +86-138-1234-5678, address 123 Tech Street, Chaoyang District, Beijing, China
```

4. 点击"Save Profile"保存

## 🚀 使用方法

### 基本使用流程

1. **访问包含表单的网页**
   - 打开任何包含表单的网站
   - 例如注册页面、联系表单、个人资料页面等

2. **打开扩展侧边栏**
   - 点击浏览器工具栏中的Smart Autofill Assistant图标
   - 侧边栏将在页面右侧打开

3. **选择个人信息配置**
   - 在"Profiles"标签中选择要使用的配置
   - 被选中的配置会高亮显示

4. **开始自动填写**
   - 点击"Start Autofill"按钮
   - 扩展将自动分析页面表单并填写相应字段

5. **查看填写结果**
   - 切换到"Status"标签查看详细的填写进度和结果
   - 检查填写的内容是否正确

### 高级功能

#### 手动页面分析
- 在"Status"标签中点击"Analyze Page"
- 可以查看扩展识别到的表单字段
- 有助于调试和了解识别结果

#### 多配置管理
- 可以创建多个不同的个人信息配置
- 例如：个人资料、工作资料、测试数据等
- 根据不同场景选择合适的配置

#### 设置调整
- 开启/关闭自动页面分析
- 开启调试模式查看详细日志
- 切换不同的AI模型提供商

## 🧪 测试功能

项目包含了一个测试页面，用于验证扩展功能：

1. 打开 `test/test-page.html` 文件
2. 该页面包含多种类型的表单
3. 使用扩展在此页面测试自动填写功能

## 🔍 故障排除

### 常见问题

**1. 扩展图标不显示**
- 确认扩展已正确加载
- 检查是否开启了开发者模式
- 尝试重新加载扩展

**2. 侧边栏无法打开**
- 刷新页面后重试
- 检查浏览器控制台是否有错误信息
- 确认当前页面支持侧边栏功能

**3. 无法识别表单字段**
- 检查页面是否包含标准的HTML表单
- 尝试手动点击"Analyze Page"
- 查看"Status"标签中的分析结果

**4. API密钥错误**
- 确认API密钥格式正确
- 检查API密钥是否有效且未过期
- 确认选择了正确的模型提供商

**5. 填写结果不准确**
- 检查个人信息配置是否完整
- 尝试使用更详细的自然语言描述
- 考虑使用更高级的AI模型

### 调试模式

开启调试模式可以获得更多信息：

1. 在"Settings"中开启"Debug mode"
2. 打开浏览器开发者工具（F12）
3. 查看Console标签中的详细日志
4. 这些信息有助于诊断问题

### 重置扩展

如果遇到严重问题，可以重置扩展：

1. 访问 `chrome://extensions/`
2. 找到Smart Autofill Assistant
3. 点击"详细信息"
4. 点击"扩展程序选项"（如果有）
5. 或者直接移除扩展后重新安装

## 📞 获取帮助

如果您遇到问题或需要帮助：

1. **查看文档**: 阅读 README.md 和相关文档
2. **检查Issues**: 查看GitHub Issues中是否有类似问题
3. **提交Issue**: 如果问题未解决，请提交新的Issue
4. **联系支持**: 发送邮件到支持邮箱

## 🔄 更新扩展

当有新版本发布时：

1. **开发者模式安装的扩展**:
   - 下载最新代码
   - 在扩展管理页面点击刷新按钮

2. **Chrome Web Store安装的扩展**:
   - 扩展会自动更新
   - 或手动检查更新

---

**注意**: 请确保在重要表单中使用前先进行测试，并始终检查自动填写的内容是否正确。