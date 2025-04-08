import { View, Text, Image, StyleSheet, Platform } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../../components/screens/AuthScreen/Login";
import Register from "../../components/screens/AuthScreen/Register";
import Welcome from "../../components/screens/AuthScreen/Welcome";
import ForgotPassword from "../../components/screens/AuthScreen/ForgotPassword";
import ResetPassword from "@/components/screens/AuthScreen/ResetPassword";
import EnterCodeForForgotPassword from "@/components/screens/AuthScreen/EnterCodeforForgotPassword";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
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
        name="EnterCodeForForgotPassword"
        component={EnterCodeForForgotPassword}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
