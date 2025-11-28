import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings, 
  Sparkles,
  Moon,
  Sun,
  Loader2,
  Bot,
  User,
  Menu,
  X,
  Zap
} from 'lucide-react'
import { directChat, streamChat, newSession, listSession, deleteSession } from './api/chat'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [useStream, setUseStream] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadSessions()
  }, [])

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const res = await listSession()
      setSessions(res.data.data || [])
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      if (useStream) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        
        for await (const chunk of streamChat({ 
          user_prompt: userMessage, 
          session_id: sessionId 
        })) {
          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1].content += chunk
            return newMessages
          })
        }
      } else {
        const res = await directChat({ 
          user_prompt: userMessage, 
          session_id: sessionId 
        })
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.data.data.result 
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，发生了错误，请重试。' 
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // 创建新会话
  const createSession = async () => {
    try {
      const res = await newSession()
      setSessionId(res.data.data.session_id)
      setMessages([])
      await loadSessions()
    } catch (error) {
      console.error('创建会话失败:', error)
    }
  }

  // 删除会话
  const handleDeleteSession = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteSession(id)
      if (sessionId === id) {
        setSessionId(null)
        setMessages([])
      }
      await loadSessions()
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
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
                </motion.div>
              </div>

              <motion.button
                className="new-chat-btn"
                onClick={createSession}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={18} />
                <span>新建对话</span>
              </motion.button>

              <div className="sessions-list">
                <div className="sessions-title">历史对话</div>
                <AnimatePresence>
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.session_id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`session-item ${sessionId === session.session_id ? 'active' : ''}`}
                      onClick={() => setSessionId(session.session_id)}
                    >
                      <MessageSquare size={16} />
                      <span>{session.title || `对话 ${index + 1}`}</span>
                      <motion.button
                        className="delete-btn"
                        onClick={(e) => handleDeleteSession(session.session_id, e)}
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
                <motion.button
                  className="footer-btn"
                  onClick={() => setDarkMode(!darkMode)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{darkMode ? '浅色模式' : '深色模式'}</span>
                </motion.button>
                
                <div className="stream-toggle">
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
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 主内容区 */}
        <main className="main-content">
          {/* 顶部栏 */}
          <header className="header">
            <motion.button
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
            <div className="header-title">
              {sessionId ? '对话中' : '开始新对话'}
            </div>
            <div className="header-badge">
              <Sparkles size={14} />
              <span>GPT-4</span>
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
                  {['解释量子计算', '写一首诗', '帮我写代码', '翻译文档'].map((text, i) => (
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
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="输入消息，按 Enter 发送..."
                disabled={loading}
              />
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
    </div>
  )
}

export default App