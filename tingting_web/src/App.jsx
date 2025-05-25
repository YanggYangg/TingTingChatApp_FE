import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import VerifyOTP from "./pages/VerifyOTP";
import store from "./redux/store";
import { SocketProvider } from "./contexts/SocketContext";
import { CloudSocketProvider } from "./contexts/CloudSocketContext";
import { CallManagerProvider } from "./contexts/CallManagerContext";
import CallModal from "./components/Call/CallModal";

//Notifications
import { generateToken, messaging  } from "./notifications/firebase";
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import FCMHandler from "./utils/FCMHandler";
import ProfileScreen from "./layouts/components/profile/ProfileScreen";

function App() {
  
  // const userId = "6601a1b2c3d4e5f678901234";
  // console.log("Using userId:", userId);
  // const userId = localStorage.getItem("userId");
  // console.log("Using userIdddddđ:", userId);

  // useEffect(() => {
  //   const userId = localStorage.getItem("userId");
  //   console.log("Using userId with FCM:", userId);
  //   //generateToken();
  //   if (userId) {
  //     generateToken(userId);
  //     console.log("Token generated and sent to backend");
  //   }

  //   onMessage(messaging, (payload) => {
  //     console.log("PAYLOAD", payload);

  //     const { title, body } = payload?.notification || {};
  //     toast.info(`${title}: ${body}`, {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });
  //   })
  // }, []);
  // const userId = localStorage.getItem("userId");

  return (
    <Provider store={store}>
      <SocketProvider>
        <CloudSocketProvider>
          <CallManagerProvider>
            <Router>
            <FCMHandler />
              <Routes>
                <Route path="/" element={<DefaultLayout />}>
                  <Route index element={<h1>Chat window</h1>} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="chat/:conversationId" element={<ChatPage />} />
                  <Route path="/contacts/:tab" element={<ContactsPage />} />
                  <Route
                    path="*"
                    element={<Navigate to="/contacts/friends" />}
                  />{" "}
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/homepage" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/profile/:userId" element={<ProfileScreen />} />
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
              <CallModal />
              <ToastContainer position="top-right" autoClose={3000} />
              <ToastContainer position="top-center" autoClose={3000} />
            </Router>
          </CallManagerProvider>
        </CloudSocketProvider>
      </SocketProvider>
    </Provider>
  );
}
export default App;
