import React from 'react'
import ReactDOM from 'react-dom/client'
import { ECJYThemeProvider } from './theme/ECJYThemeProvider'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ECJYThemeProvider>
      <App />
    </ECJYThemeProvider>
  </React.StrictMode>,
)