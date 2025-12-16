import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../ThemeContext'
import { LanguageProvider, useLanguage } from '../LanguageContext'

// Integration test component that uses both contexts
const IntegrationTestComponent = () => {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="language">{language}</span>
      <span data-testid="greeting">{t('hello_cortex')}</span>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="toggle-language" onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
        Toggle Language
      </button>
    </div>
  )
}

describe('Context Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should work with both theme and language providers', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider>
        <LanguageProvider>
          <IntegrationTestComponent />
        </LanguageProvider>
      </ThemeProvider>
    )

    // Check initial state
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('language')).toHaveTextContent('zh')
    expect(screen.getByTestId('greeting')).toHaveTextContent('你好，我是 Cortex AI')

    // Toggle theme
    await user.click(screen.getByTestId('toggle-theme'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    // Toggle language
    await user.click(screen.getByTestId('toggle-language'))
    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, I am Cortex AI')

    // Verify localStorage calls
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    expect(localStorage.setItem).toHaveBeenCalledWith('language', 'en')
  })
})