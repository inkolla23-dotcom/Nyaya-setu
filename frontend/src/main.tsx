import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { SpeechProvider } from './context/SpeechContext'
import { DataProvider } from './context/DataContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SpeechProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </SpeechProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
