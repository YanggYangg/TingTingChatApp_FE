import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// Main Screens
import ChatScreen from "../../components/screens/MainScreen/ChatScreen";
import DiaryScreen from "@/components/screens/MainScreen/DiaryScreen";
import ProfileScreen from "@/components/screens/MainScreen/Profile/ProfileScreen";
import FooterTabBar from "@/components/navigate/FooterTabBar";
import MainLayout from "@/components/screens/MainScreen/MainLayout";
import MessageScreen from "@/components/screens/MainScreen/Chat/MessageScreen";
import ChatScreenCloud from "@/components/screens/MainScreen/Cloud/ChatScreenCloud";
import FriendsScreen from "@/components/screens/MainScreen/Contact/FriendsScreen";
import RecentlyAccessedScreen from "@/components/screens/MainScreen/Contact/RecentlyAccessedScreen";
import FriendRequestsScreen from "@/components/screens/MainScreen/Contact/FriendRequestsScreen";
import SentRequestsScreen from "@/components/screens/MainScreen/Contact/SentRequestsScreen";
import GroupsScreen from "@/components/screens/MainScreen/Contact/GroupsScreen";
import OAScreen from "@/components/screens/MainScreen/Contact/OAScreen";
import PersonalInfoScreen from "@/components/screens/MainScreen/Profile/PersonalInfoScreen";
// import EditPersonalInfoScreen from "@/components/screens/MainScreen/Profile/EditPersonalInfoScreen";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
// Auth Screens
import Login from "../../components/screens/AuthScreen/Login";
import Register from "../../components/screens/AuthScreen/Register";
import Welcome from "../../components/screens/AuthScreen/Welcome";
import ForgotPassword from "../../components/screens/AuthScreen/ForgotPassword";
import ResetPassword from "@/components/screens/AuthScreen/ResetPassword";
import EnterCodeForForgotPassword from "@/components/screens/AuthScreen/EnterCodeforForgotPassword";
import Chat from "../../components/screens/MainScreen/ChatScreen";
// Main Screens
import ContactScreen from "../../components/screens/MainScreen/ContactScreen";
import ChatSupportItems from "@/components/chatitems/ChatSupportItems";
import MessageSupportScreen from "@/components/screens/MainScreen/Chat/MessageSupportScreen";

import VerificationCode from "@/components/screens/AuthScreen/VerificationCode";
import VerificationCodeRegister from "@/components/screens/AuthScreen/VerificationCodeRegister";
import ChatInfo from "@/components/screens/MainScreen/Chat/ChatInfo";

// Socket cloud
import { CloudSocketProvider } from "../../context/CloudSocketContext";

type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  ChatScreenCloud: undefined;
  RecentlyAccessed: undefined;
  FriendRequests: undefined;
  SentRequests: undefined;
  GroupsTab: undefined;
  OATab: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerificationCode: {
    phoneNumber: string;
    firstname?: string;
    surname?: string;
    day?: string;
    month?: string;
    year?: string;
    gender?: string;
    email?: string;
    password?: string;
  };
  ForgotPassword: undefined;
  ResetPassword: { phoneNumber: string };
  VerificationCodeRegister: { phoneNumber: string };
  ProfileScreen: undefined;
  PersonalInfo: {
    formData: {
      firstname: string;
      surname: string;
      day: string;
      month: string;
      year: string;
      gender: string;
      phone: string;
      avatar: string | null;
      coverPhoto: string | null;
    };
  };
  EditPersonalInfo: {
    formData: {
      firstname: string;
      surname: string;
      day: string;
      month: string;
      year: string;
      gender: string;
      phone: string;
      avatar: string | null;
      coverPhoto: string | null;
    };
  };
  MessageSupportScreen: { userId?: string; username?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const ContactStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Stack Navigator cho phần Contact/Friends
function ContactStackNavigator() {
  return (
    <ContactStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none", // Disable animations
      }}
    >
      <ContactStack.Screen name="FriendsMain" component={FriendsScreen} />
      <ContactStack.Screen
        name="RecentlyAccessed"
        component={RecentlyAccessedScreen}
      />
      <ContactStack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
      />
      <ContactStack.Screen name="SentRequests" component={SentRequestsScreen} />
      <ContactStack.Screen name="GroupsTab" component={GroupsScreen} />
      <ContactStack.Screen name="OATab" component={OAScreen} />
    </ContactStack.Navigator>
  );
}

// Stack Navigator cho phần Profile/Friends
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none", // Disable animations
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      {/* <ProfileStack.Screen
        name="EditPersonalInfo"
        component={EditPersonalInfoScreen}
      /> */}
    </ProfileStack.Navigator>
  );
}

import { SocketProvider } from "../../contexts/SocketContext";
import store from "../../redux/store";
import { Provider } from "react-redux";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FooterTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Tab navigator uses transitionSpec or animation for custom transitions, but default is fine for none
      }}
    >
      <Tab.Screen name="ChatScreen" options={{ tabBarLabel: "Tin nhắn" }}>
        {(props) => (
          <MainLayout>
            <ChatScreen {...props} />
          </MainLayout>
        )}
      </Tab.Screen>
      <Tab.Screen name="ContactTab" options={{ tabBarLabel: "Danh bạ" }}>
        {() => (
          <MainLayout>
            <ContactStackNavigator />
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
      <Tab.Screen name="ProfileTab" options={{ tabBarLabel: "Cá nhân" }}>
        {() => <ProfileStackNavigator />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  // const [userId, setUserId] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  // const userId =; // Thay thế bằng userId thực tế của bạn

  // console.log("Using userId:", userId);
  // const userId = localStorage.getItem("userId");
  // console.log("Using userIdddddđ:", userId);
  // dùng axios để gọi api lấy userId http://localhost:3001/api/v1/profile/67fe031e421896d7bc8c2e10

  // useEffect(() => {
  //   const fetchUserProfile = async () => {
  //     try {
  //       // const userId1 = await AsyncStorage.getItem("userId");
  //       // if (!userId1) {
  //       //   throw new Error("No userId found in AsyncStorage");
  //       // }
  //       // console.log("Fetched userId from AsyncStorage:", userId1);
  //       // Gọi API để lấy thông tin người dùng
  //       const response = await axios.get(
  //         `http://192.168.1.33:3001/api/v1/profile/${userId1}`,
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       const fetchedUser = response.data.data.user._id;
  //       if (!fetchedUser) {
  //         throw new Error("No userId in response");
  //       }

  //       setUserId(fetchedUser);
  //       console.log("Fetched userId:", fetchedUser);
  //     } catch (err) {
  //       console.error("Error fetching user profile:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUserProfile();
  // }, []);

  return (
    <Provider store={store}>
      <SocketProvider>
        <CloudSocketProvider>
          <Stack.Navigator
            initialRouteName="ChatInfo"
            screenOptions={{
              headerShown: false,
              animation: "none", // Disable animations
            }}
          >
              <Stack.Screen
              name="ChatInfo"
              component={ChatInfo}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Welcome"
              component={Welcome}
              options={{ headerShown: false }}
            />
            {/* Main Tab Navigator */}
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
              name="ChatScreenCloud"
              component={ChatScreenCloud}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={Register}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerificationCode"
              component={VerificationCode}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPassword}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPassword}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerificationCodeRegister"
              component={VerificationCodeRegister}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MessageSupportScreen"
              component={MessageSupportScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </CloudSocketProvider>
      </SocketProvider>
    </Provider>
  );
}

// const userId = "6601a1b2c3d4e5f678901234";
// console.log("Using userId:", userId);
