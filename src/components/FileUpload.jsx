import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { uploadDocument } from '../api/chat'

const FileUpload = ({ onUploadSuccess, onUploadError, onClose }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // 支持的文件类型
  const allowedTypes = ['.txt', '.md', '.docx']
  const allowedMimeTypes = [
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  // 验证文件类型
  const validateFile = (file) => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidExtension = allowedTypes.includes(fileExtension)
    const isValidMimeType = allowedMimeTypes.includes(file.type) || file.type === ''
    
    if (!isValidExtension && !isValidMimeType) {
      return `不支持的文件格式。支持的格式：${allowedTypes.join(', ')}`
    }
    
    // 检查文件大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return '文件大小不能超过 10MB'
    }
    
    return null
  }

  // 处理文件上传
  const handleFileUpload = useCallback(async (files) => {
    const file = files[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      if (onUploadError) onUploadError(validationError)
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)
    setUploadResult(null)

    try {
      console.log('开始上传文件:', file.name)
      const response = await uploadDocument(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setProgress(percentCompleted)
      })
      
      console.log('文件上传响应:', response.data)
      const result = response.data?.data
      console.log('解析的上传结果:', result)
      setUploadResult(result)
      
      if (onUploadSuccess) {
        onUploadSuccess(result)
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      const errorMessage = error.apiMessage || error.message || '文件上传失败'
      setError(errorMessage)
      if (onUploadError) onUploadError(errorMessage)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploadSuccess, onUploadError])

  // 拖拽处理
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  // 文件选择处理
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files)
    }
  }

  // 打开文件选择器
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  // 重置状态
  const resetUpload = () => {
    setError(null)
    setUploadResult(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <motion.div
      className="file-upload-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="file-upload-overlay" onClick={onClose}>
        <motion.div
          className="file-upload-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="file-upload-header">
            <h3>上传文档</h3>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="file-upload-body">
            {!uploadResult && !error && (
              <>
                <div
                  className={`drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={!uploading ? openFileSelector : undefined}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  
                  {uploading ? (
                    <div className="upload-progress">
                      <Loader2 size={48} className="loading-spinner" />
                      <p>上传中... {progress}%</p>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="drop-zone-content">
                      <Upload size={48} />
                      <p>拖拽文件到此处或点击选择文件</p>
                      <p className="file-types">
                        支持格式：{allowedTypes.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 上传成功 */}
            {uploadResult && (
              <motion.div
                className="upload-success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle size={48} className="success-icon" />
                <h4>上传成功！</h4>
                <div className="upload-details">
                  <p><File size={16} /> {uploadResult.filename}</p>
                  <p>文档ID: {uploadResult.document_id}</p>
                  <p>分块数量: {uploadResult.chunks_count}</p>
                  <p>已保存: {uploadResult.saved_chunks} 个分块</p>
                </div>
                <div className="upload-actions">
                  <button className="btn-secondary" onClick={resetUpload}>
                    继续上传
                  </button>
                  <button className="btn-primary" onClick={onClose}>
                    完成
                  </button>
                </div>
              </motion.div>
            )}

            {/* 上传错误 */}
            {error && (
              <motion.div
                className="upload-error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={48} className="error-icon" />
                <h4>上传失败</h4>
                <p>{error}</p>
                <div className="upload-actions">
                  <button className="btn-secondary" onClick={resetUpload}>
                    重试
                  </button>
                  <button className="btn-primary" onClick={onClose}>
                    关闭
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default FileUpload