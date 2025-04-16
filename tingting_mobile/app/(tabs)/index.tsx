import { View, Text, Image, StyleSheet, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// Auth Screens
import Login from "../../components/screens/AuthScreen/Login";
import Register from "../../components/screens/AuthScreen/Register";
import Welcome from "../../components/screens/AuthScreen/Welcome";
import ForgotPassword from "../../components/screens/AuthScreen/ForgotPassword";
import ResetPassword from "@/components/screens/AuthScreen/ResetPassword";
import EnterCodeForForgotPassword from "@/components/screens/AuthScreen/EnterCodeforForgotPassword";
import Chat from "../../components/screens/MainScreen/ChatScreen";
// Main Screens
import ChatScreen from "../../components/screens/MainScreen/ChatScreen";
import ContactScreen from "../../components/screens/MainScreen/ContactScreen";
import DiaryScreen from "@/components/screens/MainScreen/DiaryScreen";
import ProfileScreen from "@/components/screens/MainScreen/ProfileScreen";
import FooterTabBar from "@/components/navigate/FooterTabBar";
import MainLayout from "@/components/screens/MainScreen/MainLayout";
import MessageScreen from "@/components/screens/MainScreen/Chat/MessageScreen";
import ChatSupportItems from "@/components/chatitems/ChatSupportItems";
import MessageSupportScreen from "@/components/screens/MainScreen/Chat/MessageSupportScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { SocketProvider } from "../../contexts/SocketContext";
import store from "../../redux/store";
import { Provider } from "react-redux";
import axios from "axios";

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FooterTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ChatScreen" options={{ tabBarLabel: "Tin nhắn" }}>
        {(props) => (
          <MainLayout>
            <ChatScreen {...props} />
          </MainLayout>
        )}
      </Tab.Screen>
      <Tab.Screen name="ContactScreen" options={{ tabBarLabel: "Danh bạ" }}>
        {() => (
          <MainLayout>
            <ContactScreen />
          </MainLayout>
        )}
      </Tab.Screen>
      <Tab.Screen name="DiaryScreen" options={{ tabBarLabel: "Nhật ký" }}>
        {() => (
          <MainLayout>
            <DiaryScreen />
          </MainLayout>
        )}
      </Tab.Screen>
      <Tab.Screen name="ProfileScreen" options={{ tabBarLabel: "Cá nhân" }}>
        {() => (
          <MainLayout>
            <ProfileScreen />
          </MainLayout>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId1 = "67fe031e421896d7bc8c2e10"; // Thay thế bằng userId thực tế của bạn

  // console.log("Using userId:", userId);
  // const userId = localStorage.getItem("userId");
  console.log("Using userIdddddđ:", userId);
  // dùng axios để gọi api lấy userId http://localhost:3001/api/v1/profile/67fe031e421896d7bc8c2e10

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `http://172.16.1.108:3001/api/v1/profile/${userId1}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const fetchedUser = response.data.data.user._id;
        if (!fetchedUser) {
          throw new Error("No userId in response");
        }

        setUserId(fetchedUser);
        console.log("Fetched userId:", fetchedUser);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    // <Stack.Navigator initialRouteName="Welcome">
    //   <Stack.Screen
    //     name="Welcome"
    //     component={Welcome}
    //     options={{ headerShown: false }}
    //   />
    //   <Stack.Screen
    //     name="Login"
    //     component={Login}
    //     options={{ headerShown: false }}
    //   />
    //   <Stack.Screen
    //     name="ForgotPassword"
    //     component={ForgotPassword}
    //     options={{ headerShown: false }}
    //   />
    //   <Stack.Screen
    //     name="ResetPassword"
    //     component={ResetPassword}
    //     options={{ headerShown: false }}
    //   />
    //   <Stack.Screen
    //     name="EnterCodeForForgotPassword"
    //     component={EnterCodeForForgotPassword}
    //     options={{ headerShown: false }}
    //   />
    //   <Stack.Screen
    //     name="Register"
    //     component={Register}
    //     options={{ headerShown: false }}
    //   />
    //   {/* <Stack.Screen
    //     name="ChatScreen"
    //     component={ChatScreen}
    //     options={{ headerShown: false }}
    //   /> */}
    //   {/* Khi login thành công thì chuyển vào đây */}
    //   <Stack.Screen
    //     name="Main"
    //     component={MainTabNavigator}
    //     options={{ headerShown: false }}
    //   />

    // </Stack.Navigator>
    // const userId = "6601a1b2c3d4e5f678901234";
    // console.log("Using userId:", userId);
    <Provider store={store}>
      <SocketProvider userId={userId}>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MessageScreen"
            component={MessageScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MessageSupportScreen"
            component={MessageSupportScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </SocketProvider>
    </Provider>
  );
}
