import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 普通对话
export const directChat = (data) => {
  return api.post('/chat/direct_chat', data)
}

// 流式对话
export const streamChat = async function* (data) {
  const response = await fetch('/api/chat/stream_chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const text = decoder.decode(value)
    const lines = text.split('\n\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield line.slice(6)
      }
    }
  }
}

// 会话管理
export const newSession = () => api.post('/chat/new_session')
export const listSession = () => api.post('/chat/list_session')
export const getSessionDetail = (sessionId) => api.post('/chat/get_session_detail', { session_id: sessionId })
export const deleteSession = (sessionId) => api.post('/chat/del_session', { session_id: sessionId })

// 文件上传
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/chat/upload_file', formData)
}