import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// 翻译数据
const translations = {
  zh: {
    'new_chat': '新建对话',
    'history': '历史对话',
    'settings': '设置',
    'upload_document': '上传文档',
    'send_message': '发送消息',
    'input_placeholder': '输入消息，按 Enter 发送...',
    'light_mode': '浅色模式',
    'dark_mode': '深色模式',
    'stream_response': '流式响应',
    'chat_in_progress': '对话中',
    'start_new_chat': '开始新对话',
    'hello_cortex': '你好，我是 Cortex AI',
    'how_can_help': '有什么我可以帮助你的吗？',
    'error_occurred': '抱歉，发生了错误，请重试。',
    'loading_sessions': '加载会话失败',
    'create_session_failed': '创建会话失败',
    'delete_session_failed': '删除会话失败',
    'you': '你',
    'cortex_ai': 'Cortex AI',
    'disclaimer': 'Cortex AI 可能会犯错，请核实重要信息',
    'explain_quantum': '解释量子计算',
    'write_poem': '写一首诗',
    'help_code': '帮我写代码',
    'translate_doc': '翻译文档'
  },
  en: {
    'new_chat': 'New Chat',
    'history': 'Chat History',
    'settings': 'Settings',
    'upload_document': 'Upload Document',
    'send_message': 'Send Message',
    'input_placeholder': 'Type a message, press Enter to send...',
    'light_mode': 'Light Mode',
    'dark_mode': 'Dark Mode',
    'stream_response': 'Stream Response',
    'chat_in_progress': 'Chatting',
    'start_new_chat': 'Start New Chat',
    'hello_cortex': 'Hello, I am Cortex AI',
    'how_can_help': 'How can I help you today?',
    'error_occurred': 'Sorry, an error occurred. Please try again.',
    'loading_sessions': 'Failed to load sessions',
    'create_session_failed': 'Failed to create session',
    'delete_session_failed': 'Failed to delete session',
    'you': 'You',
    'cortex_ai': 'Cortex AI',
    'disclaimer': 'Cortex AI may make mistakes. Please verify important information.',
    'explain_quantum': 'Explain quantum computing',
    'write_poem': 'Write a poem',
    'help_code': 'Help me write code',
    'translate_doc': 'Translate document'
  }
}

const LanguageContext = createContext({
  language: 'zh',
  setLanguage: () => {},
  t: (key) => key,
  availableLanguages: ['zh', 'en']
})

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    // 检查本地存储
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage
    }
    
    // 检查浏览器语言
    const browserLanguage = navigator.language || navigator.userLanguage
    if (browserLanguage.startsWith('zh')) {
      return 'zh'
    } else if (browserLanguage.startsWith('en')) {
      return 'en'
    }
    
    // 默认中文
    return 'zh'
  })

  const setLanguage = useCallback((newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage)
      localStorage.setItem('language', newLanguage)
    }
  }, [])

  const t = useCallback((key, fallback = key) => {
    return translations[language]?.[key] || fallback
  }, [language])

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages: Object.keys(translations)
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageContext