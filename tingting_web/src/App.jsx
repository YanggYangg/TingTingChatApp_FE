import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import ChatPage from './pages/Chat/ChatPage';
import ContactsPage from './pages/Chat/ContactsPage';
import ContactList from './layouts/components/contact-form/ContactList/ContactList';
import { Provider } from "react-redux";
import store from "./redux/store";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
                <Route path="/" element={<DefaultLayout />}>
                    <Route index element={<h1>Chat window</h1>} />
                    <Route path="chat" element={<ChatPage/>} />
                    <Route path="contact" element={<ContactList/>} />
                </Route>
            </Routes>
     </Router>
    </Provider>
  );
}

export default App;

