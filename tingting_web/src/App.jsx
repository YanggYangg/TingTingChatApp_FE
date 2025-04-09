import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";
import ChatPage from "./pages/Chat/ChatPage";
import ContactsPage from "./pages/Chat/ContactsPage";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";

import Contact from "./layouts/components/contact-form/Contact";
import ContactList from "./layouts/components/contact-form/ContactList/ContactList";
import GroupList from "./layouts/components/contact-form/GroupList/GroupList";
import FriendRequests from "./layouts/components/contact-form/FriendRequests";
import ChatList from "./layouts/components/chatlist";

import RegisterPage from "./pages/RegisterPage";
import { forgotPasswordRoutes } from "./routes";
import ForgotAccountLayout from "./layouts/ForgotPasswordLayout";

import { Provider } from "react-redux";
import store from "./redux/store";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<h1>Chat window</h1>} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/contacts/:tab" element={<ContactsPage />} />
          <Route path="*" element={<Navigate to="/contacts/friends" />} />{" "}
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        {forgotPasswordRoutes.map((route, index) => {
          const Page = route.component;
          const Layout = ForgotAccountLayout;
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <Layout>
                  <Page />
                </Layout>
              }
            />
          );
        })}
        </Routes>
      </Router>
    </Provider>
  );
}
export default App;