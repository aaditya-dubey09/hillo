import { useAuth } from "@clerk/react"
import { Navigate, Route, Routes } from 'react-router'
import './App.css'
import PageLoader from './components/PageLoader'
import { useUserSync } from './hooks/useUserSync'
import ChatPage from './pages/ChatPage'
import HomePage from './pages/HomePage'

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  useUserSync();

  if (!isLoaded) return <PageLoader />;

  return (
    <Routes>
      <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/chat"} />} />
      <Route path="/chat" element={isSignedIn ? <ChatPage /> : <Navigate to={"/"} />} />
    </Routes>
  )
}

export default App
