import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 错误重试机制
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

// 普通对话
export const directChat = (data) => {
  return apiWithRetry(() => api.post('/chat/direct_chat', data))
}

// 流式对话
export const streamChat = async function* (data) {
  const response = await fetch('/api/chat/stream_chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const content = line.slice(6).trim()
          if (content && content !== '[DONE]') {
            // 后端直接发送文本内容，不需要特殊处理session_id
            yield { type: 'content', data: content }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// 会话管理
export const newSession = () => {
  return apiWithRetry(() => api.post('/chat/new_session'))
}

export const listSession = () => {
  return apiWithRetry(() => api.post('/chat/list_session'))
}

export const getSessionDetail = (sessionId) => {
  if (!sessionId) {
    return Promise.reject(new Error('Session ID is required'))
  }
  return apiWithRetry(() => api.post('/chat/get_session_detail', { session_id: sessionId }))
}

export const deleteSession = (sessionId) => {
  if (!sessionId) {
    return Promise.reject(new Error('Session ID is required'))
  }
  return apiWithRetry(() => api.post('/chat/del_session', { session_id: sessionId }))
}

// 文档上传功能
export const uploadDocument = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/chat/upload_document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

// 普通文件上传
export const uploadFile = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/chat/upload_file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

// 添加请求和响应拦截器进行错误处理
api.interceptors.request.use(
  (config) => {
    console.log('API请求:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('API响应:', response.config.url, response.data)
    // 后端使用Response包装器，检查是否有错误
    if (response.data && response.data.error) {
      const error = new Error(response.data.error.message || 'API Error')
      error.code = response.data.error.code
      error.apiMessage = response.data.error.message
      console.error('API业务错误:', error)
      throw error
    }
    return response
  },
  (error) => {
    console.error('API网络错误:', error)
    // 网络错误处理
    if (error.response) {
      // 服务器响应了错误状态码
      const message = error.response.data?.message || `HTTP ${error.response.status}`
      error.message = message
    } else if (error.request) {
      // 请求发出但没有收到响应
      error.message = '网络连接失败，请检查网络连接'
    }
    return Promise.reject(error)
  }
)