/**
 * 本地存储工具类
 * 提供类型安全的本地存储操作
 */

export const storage = {
  /**
   * 获取存储的值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储的值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error)
      return defaultValue
    }
  },

  /**
   * 设置存储值
   * @param {string} key - 存储键
   * @param {*} value - 要存储的值
   * @returns {boolean} 是否成功存储
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Failed to set item to localStorage: ${key}`, error)
      return false
    }
  },

  /**
   * 移除存储项
   * @param {string} key - 存储键
   * @returns {boolean} 是否成功移除
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error)
      return false
    }
  },

  /**
   * 清空所有存储
   * @returns {boolean} 是否成功清空
   */
  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear localStorage', error)
      return false
    }
  },

  /**
   * 检查键是否存在
   * @param {string} key - 存储键
   * @returns {boolean} 键是否存在
   */
  has(key) {
    return localStorage.getItem(key) !== null
  }
}

/**
 * 主题相关的存储操作
 */
export const themeStorage = {
  get: () => storage.get('theme', 'light'),
  set: (theme) => storage.set('theme', theme),
  remove: () => storage.remove('theme')
}

/**
 * 语言相关的存储操作
 */
export const languageStorage = {
  get: () => storage.get('language', 'zh'),
  set: (language) => storage.set('language', language),
  remove: () => storage.remove('language')
}

/**
 * 会话相关的存储操作
 */
export const sessionStorage = {
  getCurrentSession: () => storage.get('currentSession'),
  setCurrentSession: (sessionId) => storage.set('currentSession', sessionId),
  removeCurrentSession: () => storage.remove('currentSession'),
  
  getSessionPreferences: () => storage.get('sessionPreferences', {}),
  setSessionPreferences: (preferences) => storage.set('sessionPreferences', preferences)
}

export default storage