# Chat API 前端对接文档

## 基础信息
- **基础路径**: `/chat`
- **请求格式**: JSON
- **响应格式**: JSON

## 接口列表

### 1. 直接对话 (非流式)
**接口**: `POST /chat/direct_chat`

**请求参数**:
```json
{
  "user_prompt": "你好，请介绍一下自己",
  "system_prompt": "你是一个友好的AI助手",  // 可选
  "session_id": 123  // 可选，不传则创建新会话
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "result": {
      "result": "你好！我是一个AI助手...",
      "session_id": 123
    }
  }
}
```

### 2. 流式对话 (SSE)
**接口**: `POST /chat/stream_chat`

**请求参数**:
```json
{
  "user_prompt": "请写一首诗",
  "system_prompt": "你是一个诗人",  // 可选
  "session_id": 123  // 可选
}
```

**响应格式**: `text/event-stream`
```
data: 春
data: 风
data: 十
data: 里
data: 扬
data: 州
data: 路
```

**前端接收示例**:
```javascript
const response = await fetch('/chat/stream_chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_prompt: '请写一首诗',
    session_id: 123
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const content = line.slice(6);
      if (content.startsWith('session_id:')) {
        // 处理会话ID
        const sessionId = content.split(':')[1];
      } else {
        // 处理消息内容
        console.log(content);
      }
    }
  }
}
```

## 会话管理

### 3. 创建新会话
**接口**: `POST /chat/new_session`

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "success", 
  "data": {
    "id": 123,
    "title": "12-16 14:30",
    "created_at": "2024-12-16T14:30:00"
  }
}
```

### 4. 获取会话列表
**接口**: `POST /chat/list_session`

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 123,
      "title": "关于AI的讨论",
      "message_count": 8,
      "tags": ["AI", "技术", "讨论"],
      "created_at": "2024-12-16T14:30:00",
      "updated_at": "2024-12-16T15:45:00"
    },
    {
      "id": 124,
      "title": "诗歌创作",
      "message_count": 4,
      "tags": ["诗歌", "创作"],
      "created_at": "2024-12-16T16:00:00", 
      "updated_at": "2024-12-16T16:15:00"
    }
  ]
}
```

### 5. 获取会话详情
**接口**: `POST /chat/get_session_detail`

**请求参数**:
```json
{
  "session_id": 123
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "session": {
      "id": 123,
      "title": "关于AI的讨论",
      "tags": ["AI", "技术"],
      "created_at": "2024-12-16T14:30:00"
    },
    "messages": [
      {
        "id": 1,
        "content": "你好，请介绍一下AI",
        "sender": "user",
        "created_at": "2024-12-16T14:30:00"
      },
      {
        "id": 2,
        "content": "AI是人工智能的缩写...",
        "sender": "ai", 
        "created_at": "2024-12-16T14:30:05"
      }
    ]
  }
}
```

### 6. 删除会话
**接口**: `POST /chat/del_session`

**请求参数**:
```json
{
  "session_id": 123
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

## 文件上传

### 7. 上传知识文档 (RAG)
**接口**: `POST /chat/upload_document`

**请求格式**: `multipart/form-data`

**请求参数**:
- `file`: 文件 (支持 .txt, .md, .docx)

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "document_id": 456,
    "filename": "knowledge.txt",
    "chunks_count": 10,
    "saved_chunks": 8
  }
}
```

### 8. 上传普通文件
**接口**: `POST /chat/upload_file`

**请求格式**: `multipart/form-data`

**请求参数**:
- `file`: 任意文件

**响应示例**:
```json
{
  "code": 200,
  "message": "success", 
  "data": {
    "status": "upload_success"
  }
}
```

## 错误处理

### 常见错误码
- `SESSION_NOT_FOUND`: 会话不存在
- `REACH_OUT_LIMIT`: 达到使用限制

### 错误响应格式
```json
{
  "code": 400,
  "message": "error",
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "会话不存在"
  }
}
```

## 前端集成建议

### 1. 会话管理流程
```javascript
// 1. 获取会话列表
const sessions = await fetchSessions();

// 2. 选择会话或创建新会话
let sessionId = selectedSessionId || (await createNewSession()).id;

// 3. 开始对话
await streamChat(userInput, sessionId);
```

### 2. 流式对话处理
```javascript
async function streamChat(message, sessionId) {
  const response = await fetch('/chat/stream_chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_prompt: message,
      session_id: sessionId
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let aiResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const content = line.slice(6);
        if (!content.startsWith('session_id:')) {
          aiResponse += content;
          // 实时更新UI显示
          updateChatUI(content);
        }
      }
    }
  }
}
```

### 3. 文件上传
```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/chat/upload_document', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}
```

## 注意事项

1. **会话ID管理**: 前端需要妥善管理会话ID，建议存储在本地状态中
2. **流式响应**: 使用 Server-Sent Events (SSE) 处理流式响应
3. **错误处理**: 统一处理API错误响应
4. **文件上传**: 支持拖拽上传和进度显示
5. **消息渲染**: 支持Markdown格式和代码高亮

## 示例完整前端代码

```javascript
class ChatAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async request(url, options = {}) {
    const response = await fetch(this.baseURL + url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await response.json();
  }

  // 创建新会话
  async createSession() {
    return this.request('/chat/new_session', { method: 'POST' });
  }

  // 获取会话列表  
  async getSessions() {
    return this.request('/chat/list_session', { method: 'POST' });
  }

  // 获取会话详情
  async getSessionDetail(sessionId) {
    return this.request('/chat/get_session_detail', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId })
    });
  }

  // 删除会话
  async deleteSession(sessionId) {
    return this.request('/chat/del_session', {
      method: 'POST', 
      body: JSON.stringify({ session_id: sessionId })
    });
  }

  // 直接对话
  async directChat(userPrompt, sessionId, systemPrompt) {
    return this.request('/chat/direct_chat', {
      method: 'POST',
      body: JSON.stringify({
        user_prompt: userPrompt,
        session_id: sessionId,
        system_prompt: systemPrompt
      })
    });
  }

  // 流式对话
  async streamChat(userPrompt, sessionId, systemPrompt, onChunk) {
    const response = await fetch(this.baseURL + '/chat/stream_chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_prompt: userPrompt,
        session_id: sessionId,
        system_prompt: systemPrompt
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const content = line.slice(6);
          if (content && onChunk) {
            onChunk(content);
          }
        }
      }
    }
  }

  // 上传文档
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(this.baseURL + '/chat/upload_document', {
      method: 'POST',
      body: formData
    });
    
    return await response.json();
  }
}

// 使用示例
const chatAPI = new ChatAPI();

// 创建会话并开始对话
async function startChat() {
  const session = await chatAPI.createSession();
  const sessionId = session.data.id;
  
  await chatAPI.streamChat(
    '你好，请介绍一下自己',
    sessionId,
    null,
    (chunk) => {
      console.log('收到消息片段:', chunk);
      // 更新UI
    }
  );
}
```