import { View, Text, Image, StyleSheet, Platform } from "react-native";
import React from "react";
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
    
    </Stack.Navigator>

  );
}
