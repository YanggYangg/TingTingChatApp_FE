import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
// Main Screens
import ChatScreen from "../../components/screens/MainScreen/ChatScreen"
import DiaryScreen from "@/components/screens/MainScreen/DiaryScreen"
import ProfileScreen from "@/components/screens/MainScreen/Profile/ProfileScreen"
import FooterTabBar from "@/components/navigate/FooterTabBar"
import MainLayout from "@/components/screens/MainScreen/MainLayout"
import MessageScreen from "@/components/screens/MainScreen/Chat/MessageScreen"
import ChatScreenCloud from "@/components/screens/MainScreen/Cloud/ChatScreenCloud"
import FriendsScreen from "@/components/screens/MainScreen/Contact/FriendsScreen"
import RecentlyAccessedScreen from "@/components/screens/MainScreen/Contact/RecentlyAccessedScreen"
import FriendRequestsScreen from "@/components/screens/MainScreen/Contact/FriendRequestsScreen"
import SentRequestsScreen from "@/components/screens/MainScreen/Contact/SentRequestsScreen"
import GroupsScreen from "@/components/screens/MainScreen/Contact/GroupsScreen"
import OAScreen from "@/components/screens/MainScreen/Contact/OAScreen"
import PersonalInfoScreen from "@/components/screens/MainScreen/Profile/PersonalInfoScreen"
import EditPersonalInfoScreen from "@/components/screens/MainScreen/Profile/EditPersonalInfoScreen"


type RootStackParamList = {
  Main: undefined
  MessageScreen: { userId?: string; username?: string }
  ChatScreenCloud: undefined
  RecentlyAccessed: undefined
  FriendRequests: undefined
  SentRequests: undefined
  GroupsTab: undefined
  OATab: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()
const ContactStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()

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
      <ContactStack.Screen name="RecentlyAccessed" component={RecentlyAccessedScreen} />
      <ContactStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      <ContactStack.Screen name="SentRequests" component={SentRequestsScreen} />
      <ContactStack.Screen name="GroupsTab" component={GroupsScreen} />
      <ContactStack.Screen name="OATab" component={OAScreen} />
    </ContactStack.Navigator>
  )
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
      <ProfileStack.Screen name="EditPersonalInfo" component={EditPersonalInfoScreen} />
      
    </ProfileStack.Navigator>
  )
}

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
        {() => (
          
          <ProfileStackNavigator />
          
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        animation: "none", // Disable animations
      }}
    >
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="MessageScreen" component={MessageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatScreenCloud" component={ChatScreenCloud} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}