import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import ChatPage from './pages/Chat/ChatPage';
import ContactsPage from './pages/Chat/ContactsPage';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import ForgotAccountPage from './pages/ForgotAccountPage';


function App() {
  return (
    
     <Router>
        <Routes>
                <Route path="/" element={<DefaultLayout />}>
                    <Route index element={<h1>Chat window</h1>} />
                    <Route path="chat" element={<ChatPage/>} />
                    <Route path="contact" element={<ContactsPage/>} />
                    
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/homepage" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgotAccount" element={<ForgotAccountPage />} />
            </Routes>
     </Router>
  )
}

export default App
