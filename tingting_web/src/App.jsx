import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React,  {useState } from "react";
import DefaultLayout from "./layouts/DefaultLayout";
import ChatPage from "./pages/Chat/ChatPage";
import ContactsPage from "./pages/Chat/ContactsPage";

import Contact from './layouts/components/contact-form/Contact';
import ContactList from './layouts/components/contact-form/ContactList/ContactList';
import GroupList from './layouts/components/contact-form/GroupList/GroupList';
import FriendRequests from './layouts/components/contact-form/FriendRequests';
import ChatList from "./layouts/components/chatlist";

import { Provider } from "react-redux";
import store from "./redux/store";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<DefaultLayout />}>
            <Route index element={<h1>Chat window</h1>} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="/contacts/:tab" element={<ContactsPage />} />
        <Route path="*" element={<Navigate to="/contacts/friends" />} /> {/* Mặc định chuyển đến bạn bè */}
              
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
