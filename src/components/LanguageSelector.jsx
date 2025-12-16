import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

const LanguageSelector = () => {
  const { language, setLanguage, availableLanguages } = useLanguage()

  const languageNames = {
    zh: '中文',
    en: 'English'
  }

  const toggleLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language)
    const nextIndex = (currentIndex + 1) % availableLanguages.length
    setLanguage(availableLanguages[nextIndex])
  }

  return (
    <motion.button
      className="language-selector"
      onClick={toggleLanguage}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${language === 'zh' ? 'English' : '中文'}`}
    >
      <Globe size={18} />
      <span>{languageNames[language]}</span>
    </motion.button>
  )
}

export default LanguageSelector