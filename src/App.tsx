import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import UserPanel from './components/UserPanel'
import FlowchartEditor from './components/FlowchartEditor'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    // Проверяем, есть ли сохраненная информация о пользователе
    const savedUsername = localStorage.getItem('username')
    if (savedUsername) {
      setUsername(savedUsername)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (userName: string) => {
    setUsername(userName)
    setIsAuthenticated(true)
    // Сохраняем имя пользователя в localStorage
    localStorage.setItem('username', userName)
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <>
      <UserPanel username={username} status="гость" />
      <FlowchartEditor />
    </>
  )
}

export default App
