import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Sparkles,
  Loader2,
  Bot,
  User,
  Menu,
  X,
  Zap,
  Upload
} from 'lucide-react'
import { directChat, streamChat } from './api/chat'
import { useSessionManager } from './hooks/useSessionManager'
import FileUpload from './components/FileUpload'
import './App.css'
import './components/ThemeButton.js' // 引入日月主题切换按钮

// 预置建议问题，避免在渲染时重复创建数组
const SUGGESTIONS = ['解释量子计算', '写一首诗', '帮我写代码', '翻译文档']

function App() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useStream, setUseStream] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 使用会话管理器
  const {
    sessions,
    currentSession,
    messages,
    loading: sessionLoading,
    error: sessionError,
    selectSession,
    createNewSession,
    removeSession,
    addMessage,
    updateLastMessage,
    clearError
  } = useSessionManager()

  // 自动滚动到底部，使用 useCallback 保证引用稳定
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 处理会话选择
  const handleSessionSelect = useCallback(async (sessionId) => {
    await selectSession(sessionId)
  }, [selectSession])

  // 处理会话删除确认
  const handleDeleteConfirm = useCallback(async (sessionId) => {
    const success = await removeSession(sessionId)
    if (success) {
      setShowDeleteConfirm(null)
    }
  }, [removeSession])

  useEffect(() => {
    const handldThemeChange = (e) => {
      document.body.setAttribute('data-theme',e.detail)

    };
    window.addEventListener('change', handldThemeChange)
    return () => window.removeEventListener('change', handldThemeChange);
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 首次渲染自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    
    // 添加用户消息
    addMessage({ role: 'user', content: userMessage })
    setLoading(true)

    try {
      if (useStream) {
        // 添加空的AI消息用于流式更新
        addMessage({ role: 'assistant', content: '' })
        
        for await (const chunk of streamChat({ 
          user_prompt: userMessage, 
          session_id: currentSession 
        })) {
          if (chunk.type === 'content') {
            updateLastMessage(prev => ({
              ...prev,
              content: (prev.content || '') + chunk.data
            }))
          }
        }
      } else {
        const res = await directChat({ 
          user_prompt: userMessage, 
          session_id: currentSession 
        })
        // 后端返回结构：Response(data={"result": completion})
        const result = res.data?.data?.result
        addMessage({ 
          role: 'assistant', 
          content: result || '抱歉，没有收到回复'
        })
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      addMessage({ 
        role: 'assistant', 
        content: '抱歉，发生了错误，请重试。' 
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // 创建新会话
  const handleCreateSession = async () => {
    await createNewSession()
  }

  // 删除会话
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation()
    setShowDeleteConfirm(sessionId)
  }

  // 文件上传处理
  const handleUploadSuccess = useCallback((result) => {
    console.log('文件上传成功:', result)
    // 可以在这里添加成功提示或其他逻辑
  }, [])

  const handleUploadError = useCallback((error) => {
    console.error('文件上传失败:', error)
    // 可以在这里添加错误提示
  }, [])

  return (
    <div className="app">
      <div className="app-container">
        {/* 侧边栏 */}


        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="sidebar"
            >
              <div className="sidebar-header">
                <motion.div 
                  className="logo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="logo-icon" />
                  <span>Cortex AI</span>

                  {/* 放置缩放侧边栏的地方 */}
                  <motion.button
                    className="menu-btn"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  </motion.button>
                </motion.div>
              </div>

            

              <motion.button
                className="new-chat-btn"
                onClick={handleCreateSession}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={18} />
                <span>新建对话</span>
              </motion.button>

              <div className="sessions-list">
                <div className="sessions-title">历史对话</div>
                {sessionError && (
                  <div className="error-message" onClick={clearError}>
                    {sessionError}
                  </div>
                )}
                <AnimatePresence>
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.id || session.session_id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`session-item ${currentSession === (session.id || session.session_id) ? 'active' : ''}`}
                      onClick={() => handleSessionSelect(session.id || session.session_id)}
                    >
                      <MessageSquare size={16} />
                      <span>{session.title || `对话 ${index + 1}`}</span>
                      <motion.button
                        className="delete-btn"
                        onClick={(e) => handleDeleteSession(session.id || session.session_id, e)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="sidebar-footer">
                {/* <motion.button
                  className="footer-btn"
                  onClick={() => setDarkMode(!darkMode)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{darkMode ? '浅色模式' : '深色模式'}</span>
                </motion.button> */}

                <div className='user-settings'>
                  <div className='avatar'>
                    avatar
                  </div>
                  <div className='login_name'>login_name</div>
                </div>
  
                {/* <div className="stream-toggle">
                  <Zap size={16} />
                  <span>流式响应</span>
                  <motion.button
                    className={`toggle ${useStream ? 'active' : ''}`}
                    onClick={() => setUseStream(!useStream)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div 
                      className="toggle-thumb"
                      animate={{ x: useStream ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div> */}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>


        

        {/* 主内容区 */}
        <main className="main-content">
          {/* 顶部栏 */}
          <header className="header">

                        {/* 👇 插入日月主题按钮 👇 */}
            <theme-button 
              size="1" 
              style={{ 
                position: 'absolute',  // 1. 开启绝对定位
                right: '20px',         // 2. 距离右边 20px
                top: '15px',           // 3. 距离顶部 15px (根据Header高度微调)
                width: '48px', 
                height: '48px',
                zIndex: 10             // 4. 确保在最上层，不被其他元素遮挡
              }}
            ></theme-button>

            {/* <div className="header-title">
              {currentSession ? '总结对话内容' : '开始新对话'}
              {sessionLoading && <Loader2 size={16} className="loading-icon" />}
            </div> */}
            



            <div className="header-badge">
              <Sparkles size={14} />
              {/* <span>GPT-4</span> */}
            </div>

          </header>

          {/* 消息区域 */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <motion.div 
                className="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="welcome-icon"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Sparkles size={48} />
                </motion.div>
                <h1>你好，我是 Cortex AI</h1>
                <p>有什么我可以帮助你的吗？</p>
                
                <div className="suggestions">
                  {SUGGESTIONS.map((text, i) => (
                    <motion.button
                      key={i}
                      className="suggestion"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInput(text)}
                    >
                      {text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="messages">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        type: 'spring',
                        damping: 25,
                        stiffness: 200
                      }}
                      className={`message ${msg.role}`}
                    >
                      <div className="avatar">
                        {msg.role === 'user' ? (
                          <User size={20} />
                        ) : (
                          <Bot size={20} />
                        )}
                      </div>
                      <div className="message-content">
                        <div className="message-role">
                          {msg.role === 'user' ? '你' : 'Cortex AI'}
                        </div>
                        <div className="message-text">
                          {msg.content}
                          {loading && idx === messages.length - 1 && msg.role === 'assistant' && (
                            <motion.span 
                              className="cursor"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            >
                              |
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="input-container">
            <motion.div 
              className="input-wrapper"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="输入消息，按 Enter 发送..."
                disabled={loading}
              />

                {/* 上传按钮 */}
              <motion.button
                className="upload-btn"
                onClick={() => setShowFileUpload(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload size={16} />
                <span>上传文档</span>
              </motion.button>

              <motion.button
                className="send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={20} />
                  </motion.div>
                ) : (
                  <Send size={20} />
                )}
              </motion.button>
            </motion.div>
            <div className="input-hint">
              Cortex AI 可能会犯错，请核实重要信息
            </div>
          </div>
        </main>
      </div>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>确认删除</h3>
              <p>确定要删除这个会话吗？此操作无法撤销。</p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  取消
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 文件上传弹窗 */}
      <AnimatePresence>
        {showFileUpload && (
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            onClose={() => setShowFileUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App