import { View, Text, Image, StyleSheet, Platform } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Login from "../../components/screens/AuthScreen/Login";
import Register from "../../components/screens/AuthScreen/Register";
import Welcome from "../../components/screens/AuthScreen/Welcome";

import Chat from "../../components/screens/MainScreen/Chat";
import Contact from "../../components/screens/MainScreen/Contact";
import Diary from "../../components/screens/MainScreen/Diary";
import Profile from "../../components/screens/MainScreen/Profile";
import CustomTabBar from "@/components/navigate/CustomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ headerShown: false }}/>
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />} // <- dùng tab bar của bạn
      screenOptions={{
        headerShown: false, // Ẩn header từng screen trong tab
      }}
    >
      <Tab.Screen
        name="Home"
        component={Chat}
      />
      <Tab.Screen
        name="MyCourse"
        component={Contact}
      />
      <Tab.Screen
        name="Search"
        component={Diary}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
      />
    </Tab.Navigator>
  );
}
