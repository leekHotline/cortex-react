import { useState, useCallback, useEffect } from 'react'
import { listSession, newSession, deleteSession, getSessionDetail } from '../api/chat'
import { sessionStorage } from '../utils/storage'

export const useSessionManager = () => {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(() => {
    return sessionStorage.getCurrentSession()
  })
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      setError(null)
      console.log('开始加载会话列表...')
      const response = await listSession()
      console.log('会话列表响应:', response.data)
      const sessionList = response.data?.data || []
      console.log('解析的会话列表:', sessionList)
      setSessions(sessionList)
      return sessionList
    } catch (error) {
      console.error('加载会话失败:', error)
      setError('加载会话失败: ' + error.message)
      return []
    }
  }, [])

  // 选择会话
  const selectSession = useCallback(async (sessionId) => {
    if (currentSession === sessionId) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('选择会话:', sessionId)
      // 如果有会话详情API，使用它加载消息
      if (getSessionDetail) {
        const response = await getSessionDetail(sessionId)
        console.log('会话详情响应:', response.data)
        const sessionData = response.data?.data
        console.log('解析的会话数据:', sessionData)
        setMessages(sessionData?.messages || [])
      } else {
        // 否则清空消息，让用户开始新对话
        setMessages([])
      }
      
      setCurrentSession(sessionId)
      sessionStorage.setCurrentSession(sessionId)
    } catch (error) {
      console.error('加载会话详情失败:', error)
      setError('加载会话详情失败: ' + error.message)
      // 即使失败也切换会话，只是不加载历史消息
      setCurrentSession(sessionId)
      sessionStorage.setCurrentSession(sessionId)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [currentSession])

  // 创建新会话
  const createNewSession = useCallback(async () => {
    try {
      setError(null)
      const response = await newSession()
      // 后端返回的数据结构：Response(data=session_info)
      const sessionInfo = response.data?.data
      const newSessionId = sessionInfo?.id || sessionInfo?.session_id
      
      if (newSessionId) {
        setCurrentSession(newSessionId)
        sessionStorage.setCurrentSession(newSessionId)
        setMessages([])
        
        // 重新加载会话列表
        await loadSessions()
        return newSessionId
      } else {
        throw new Error('未能获取新会话ID')
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      setError('创建会话失败')
      return null
    }
  }, [loadSessions])

  // 删除会话
  const removeSession = useCallback(async (sessionId) => {
    try {
      setError(null)
      await deleteSession(sessionId)
      
      // 如果删除的是当前会话，清空当前状态
      if (currentSession === sessionId) {
        setCurrentSession(null)
        sessionStorage.removeCurrentSession()
        setMessages([])
      }
      
      // 重新加载会话列表
      await loadSessions()
      return true
    } catch (error) {
      console.error('删除会话失败:', error)
      setError('删除会话失败')
      return false
    }
  }, [currentSession, loadSessions])

  // 添加消息到当前会话
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message])
  }, [])

  // 更新最后一条消息（用于流式响应）
  const updateLastMessage = useCallback((updater) => {
    setMessages(prev => {
      if (prev.length === 0) return prev
      
      const newMessages = [...prev]
      const lastIndex = newMessages.length - 1
      const lastMessage = newMessages[lastIndex]
      
      if (typeof updater === 'function') {
        newMessages[lastIndex] = updater(lastMessage)
      } else {
        newMessages[lastIndex] = { ...lastMessage, ...updater }
      }
      
      return newMessages
    })
  }, [])

  // 清空错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化时加载会话列表
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    // 状态
    sessions,
    currentSession,
    messages,
    loading,
    error,
    
    // 操作
    loadSessions,
    selectSession,
    createNewSession,
    removeSession,
    addMessage,
    updateLastMessage,
    setMessages,
    clearError
  }
}

export default useSessionManager