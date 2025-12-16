import { storage, themeStorage, languageStorage, sessionStorage } from '../storage'

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('basic storage operations', () => {
    it('should store and retrieve values', () => {
      const testValue = { test: 'value', number: 42 }
      
      // Mock localStorage to return the stringified value
      localStorage.getItem.mockReturnValue(JSON.stringify(testValue))
      
      expect(storage.set('test-key', testValue)).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testValue))
      expect(storage.get('test-key')).toEqual(testValue)
    })

    it('should return default value when key does not exist', () => {
      expect(storage.get('non-existent', 'default')).toBe('default')
      expect(storage.get('non-existent')).toBe(null)
    })

    it('should check if key exists', () => {
      localStorage.getItem.mockImplementation((key) => {
        return key === 'existing-key' ? '"value"' : null
      })
      
      expect(storage.has('existing-key')).toBe(true)
      expect(storage.has('non-existent')).toBe(false)
    })

    it('should remove values', () => {
      // First mock that the key exists
      localStorage.getItem.mockReturnValue('"value"')
      expect(storage.has('to-remove')).toBe(true)
      
      // Then mock that it's removed
      localStorage.getItem.mockReturnValue(null)
      expect(storage.remove('to-remove')).toBe(true)
      expect(localStorage.removeItem).toHaveBeenCalledWith('to-remove')
      expect(storage.has('to-remove')).toBe(false)
    })

    it('should clear all storage', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      
      expect(storage.clear()).toBe(true)
      expect(localStorage.clear).toHaveBeenCalled()
    })
  })

  describe('themeStorage', () => {
    it('should handle theme storage operations', () => {
      expect(themeStorage.get()).toBe('light') // default
      
      themeStorage.set('dark')
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', '"dark"')
      
      themeStorage.remove()
      expect(localStorage.removeItem).toHaveBeenCalledWith('theme')
    })
  })

  describe('languageStorage', () => {
    it('should handle language storage operations', () => {
      expect(languageStorage.get()).toBe('zh') // default
      
      languageStorage.set('en')
      expect(localStorage.setItem).toHaveBeenCalledWith('language', '"en"')
      
      languageStorage.remove()
      expect(localStorage.removeItem).toHaveBeenCalledWith('language')
    })
  })

  describe('sessionStorage', () => {
    it('should handle session storage operations', () => {
      expect(sessionStorage.getCurrentSession()).toBe(null) // default
      
      sessionStorage.setCurrentSession('session-123')
      expect(localStorage.setItem).toHaveBeenCalledWith('currentSession', '"session-123"')
      
      sessionStorage.removeCurrentSession()
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentSession')
    })

    it('should handle session preferences', () => {
      const preferences = { streamMode: true, autoSave: false }
      
      expect(sessionStorage.getSessionPreferences()).toEqual({}) // default
      
      sessionStorage.setSessionPreferences(preferences)
      expect(localStorage.setItem).toHaveBeenCalledWith('sessionPreferences', JSON.stringify(preferences))
    })
  })

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      expect(storage.set('test', 'value')).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle JSON parse errors gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid-json{')
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      expect(storage.get('test', 'default')).toBe('default')
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })
})