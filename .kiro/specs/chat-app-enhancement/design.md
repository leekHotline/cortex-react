# 聊天应用功能增强设计文档

## 概述

本设计文档详细描述了聊天应用功能增强的技术实现方案，包括后端API对接、文档上传处理、会话管理修复、主题系统改进和多语言支持等功能的架构设计和实现细节。

## 架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   后端API       │    │   向量数据库     │
│                │    │                │    │                │
│ - React组件     │◄──►│ - 聊天接口      │◄──►│ - 文档向量      │
│ - 状态管理      │    │ - 会话管理      │    │ - 相似度检索    │
│ - 主题系统      │    │ - 文件处理      │    │                │
│ - 国际化       │    │ - 向量化处理    │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 组件架构
```
App
├── ThemeProvider (主题上下文)
├── LanguageProvider (语言上下文)
├── Header
│   ├── MenuButton
│   ├── ThemeButton
│   ├── LanguageSelector
│   └── StatusBadge
├── Sidebar
│   ├── SessionList
│   ├── NewChatButton
│   └── SettingsPanel
├── ChatArea
│   ├── MessageList
│   ├── WelcomeScreen
│   └── InputArea
└── FileUpload (文档上传组件)
```

## 组件和接口

### 1. API服务层 (api/chat.js)

**现有接口增强:**
```javascript
// 添加文档上传接口
export const uploadDocument = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/chat/upload_document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

// 增强会话详情获取
export const getSessionDetail = (sessionId) => {
  return api.post('/chat/get_session_detail', { session_id: sessionId })
}

// 添加错误重试机制
export const apiWithRetry = async (apiCall, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 2. 主题系统 (contexts/ThemeContext.jsx)

**新增主题上下文:**
```javascript
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false
})

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.body.setAttribute('data-theme', newTheme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 3. 国际化系统 (contexts/LanguageContext.jsx)

**多语言支持:**
```javascript
const translations = {
  zh: {
    'new_chat': '新建对话',
    'history': '历史对话',
    'settings': '设置',
    'upload_document': '上传文档',
    'send_message': '发送消息',
    // ... 更多翻译
  },
  en: {
    'new_chat': 'New Chat',
    'history': 'Chat History', 
    'settings': 'Settings',
    'upload_document': 'Upload Document',
    'send_message': 'Send Message',
    // ... 更多翻译
  }
}

const LanguageContext = createContext({
  language: 'zh',
  setLanguage: () => {},
  t: (key) => key
})
```

### 4. 文档上传组件 (components/FileUpload.jsx)

**文档处理功能:**
```javascript
const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileUpload = async (files) => {
    const file = files[0]
    
    // 文件类型验证
    const allowedTypes = ['.txt', '.md', '.docx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(fileExtension)) {
      onUploadError('不支持的文件格式')
      return
    }

    setUploading(true)
    try {
      const response = await uploadDocument(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setProgress(percentCompleted)
      })
      
      onUploadSuccess(response.data)
    } catch (error) {
      onUploadError(error.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="file-upload">
      <input
        type="file"
        accept=".txt,.md,.docx"
        onChange={(e) => handleFileUpload(e.target.files)}
        disabled={uploading}
      />
      {uploading && <ProgressBar progress={progress} />}
    </div>
  )
}
```

### 5. 会话管理增强 (hooks/useSessionManager.js)

**会话状态管理:**
```javascript
export const useSessionManager = () => {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const loadSessions = useCallback(async () => {
    try {
      const response = await listSession()
      setSessions(response.data?.data || [])
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }, [])

  const selectSession = useCallback(async (sessionId) => {
    if (currentSession === sessionId) return
    
    setLoading(true)
    try {
      const response = await getSessionDetail(sessionId)
      setCurrentSession(sessionId)
      setMessages(response.data?.data?.messages || [])
    } catch (error) {
      console.error('加载会话详情失败:', error)
    } finally {
      setLoading(false)
    }
  }, [currentSession])

  const createNewSession = useCallback(async () => {
    try {
      const response = await newSession()
      const newSessionId = response.data?.data?.id
      setCurrentSession(newSessionId)
      setMessages([])
      await loadSessions()
      return newSessionId
    } catch (error) {
      console.error('创建会话失败:', error)
    }
  }, [loadSessions])

  return {
    sessions,
    currentSession,
    messages,
    loading,
    loadSessions,
    selectSession,
    createNewSession,
    setMessages
  }
}
```

## 数据模型

### 会话模型
```typescript
interface Session {
  id: number
  title: string
  message_count: number
  tags: string[]
  created_at: string
  updated_at: string
}

interface Message {
  id: number
  content: string
  sender: 'user' | 'ai'
  created_at: string
}

interface SessionDetail {
  session: Session
  messages: Message[]
}
```

### 文档模型
```typescript
interface DocumentUpload {
  document_id: number
  filename: string
  chunks_count: number
  saved_chunks: number
}

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
```

### 主题模型
```typescript
interface ThemeConfig {
  theme: 'light' | 'dark'
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
}
```

## 正确性属性

*属性是应该在系统所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在分析所有可测试属性后，我识别出以下冗余和合并机会：
- 属性1和属性2都涉及文档上传流程，可以合并为一个综合的文档上传属性
- 属性4、5、6都涉及会话管理的不同方面，但每个都提供独特的验证价值，保持独立
- 属性7和属性8都涉及主题系统，但测试不同方面，保持独立
- 属性9、10、11、12都涉及语言系统的不同方面，但每个都有独特价值，保持独立

### 正确性属性

**属性 1: 文档上传和处理完整性**
*对于任何* 支持的文档文件（txt、md、docx），上传后应该成功处理并在向量数据库中生成相应的向量数据，且用户界面应显示上传进度
**验证需求: 1.1, 1.2, 1.5**

**属性 2: 基于文档的智能问答**
*对于任何* 已上传的文档，当用户询问文档相关内容时，AI回复应包含基于该文档的相关信息
**验证需求: 1.3**

**属性 3: 会话选择和消息加载**
*对于任何* 存在的会话，当用户选择该会话时，应该加载并显示该会话的完整消息历史
**验证需求: 2.1**

**属性 4: 新会话创建唯一性**
*对于任何* 新会话创建操作，应该生成唯一的会话ID，清空当前对话区域，并更新会话列表
**验证需求: 2.2**

**属性 5: 会话删除一致性**
*对于任何* 存在的会话，删除操作后该会话应从会话列表中移除，如果是当前会话则清空对话区域
**验证需求: 2.3**

**属性 6: 主题切换状态一致性**
*对于任何* 主题切换操作，应用的主题状态、界面样式和本地存储应保持一致
**验证需求: 3.1, 3.2, 3.3**

**属性 7: 语言切换完整性**
*对于任何* 语言切换操作，所有界面文本应切换到目标语言，且设置应保存到本地存储
**验证需求: 4.1, 4.2, 4.4**

**属性 8: 语言系统初始化正确性**
*对于任何* 应用启动，应根据浏览器语言设置或用户偏好选择正确的初始语言
**验证需求: 4.3**

**属性 9: 翻译覆盖完整性**
*对于任何* 支持的语言（中文、英文），所有需要翻译的界面文本都应有对应的翻译
**验证需求: 4.5**

**属性 10: 聊天功能基本正确性**
*对于任何* 有效的用户消息，系统应能处理并返回AI回复
**验证需求: 5.1**

**属性 11: 流式响应实时性**
*对于任何* 启用流式模式的对话，AI回复应逐字符实时显示在界面上
**验证需求: 5.2**

## 错误处理

### 1. API错误处理
- **网络错误**: 实现自动重试机制，最多重试3次，每次间隔递增
- **服务器错误**: 显示用户友好的错误信息，提供重试选项
- **会话错误**: 当会话ID无效时，自动创建新会话或返回会话列表

### 2. 文件上传错误处理
- **文件类型错误**: 验证文件扩展名，拒绝不支持的格式
- **文件大小错误**: 限制文件大小，超出限制时显示错误提示
- **上传失败**: 显示具体错误信息，允许重新上传

### 3. 主题系统错误处理
- **主题加载失败**: 回退到默认浅色主题
- **动画错误**: 禁用动画效果，保持基本功能

### 4. 语言系统错误处理
- **翻译缺失**: 显示原始key值作为后备
- **语言检测失败**: 默认使用中文

## 测试策略

### 单元测试
使用Jest和React Testing Library进行组件级测试：
- 组件渲染测试
- 用户交互测试
- 状态管理测试
- API调用测试

### 属性基于测试
使用fast-check库进行属性基于测试，每个属性测试运行最少100次迭代：
- 文档上传和处理流程测试
- 会话管理功能测试
- 主题切换功能测试
- 语言切换功能测试
- API交互测试

### 集成测试
- 端到端用户流程测试
- API集成测试
- 文件上传完整流程测试

### 测试标记规范
每个属性基于测试必须使用以下格式标记：
```javascript
// **Feature: chat-app-enhancement, Property 1: 文档上传和处理完整性**
```

### 测试配置
- 属性测试最少运行100次迭代
- 使用fast-check作为属性测试库
- 每个正确性属性对应一个独立的属性测试
- 测试应尽量避免使用mock，测试真实功能