"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SettingProfileScreen from "./SettingProfileScreen";

type RootStackParamList = {
  MainScreen: undefined;
  ProfileScreen: {
    profileId: string;
  };
  SettingsScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MenuProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [showSettings, setShowSettings] = useState(false);

  const navigateToProfile = async () => {
    const profileId = (await AsyncStorage.getItem("userId")) || "defaultId";
    console.log("Profile ID:", profileId);
    navigation.navigate("ProfileScreen", {
      profileId,
    });
  };
  const [formData, setFormData] = useState({
    firstname: "",
    surname: "",

    avatar:
      "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
  });

  useEffect(() => {
    const loadProfileFromLocal = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem("profile");
        if (!storedProfile) return;

        const profile = JSON.parse(storedProfile);
        const date = new Date(profile.dateOfBirth);
        const day = date.getDate().toString();
        const month = (date.getMonth() + 1).toString();
        const year = date.getFullYear().toString();

        setFormData((prev) => ({
          firstname: profile.firstname || "",
          surname: profile.surname || "",
          avatar:
            profile.avatar ||
            "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
        }));
      } catch (error) {
        console.error("Error loading profile from localStorage:", error);
      }
    };

    loadProfileFromLocal();
  }, []);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    showArrow = false
  ) => (
    <View style={styles.menuItem}>
      <View style={styles.menuIconContainer}>{icon}</View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      {showArrow && (
        <Icon
          name="chevron-forward"
          size={20}
          color="#CCCCCC"
          style={styles.arrowIcon}
        />
      )}
    </View>
  );

  if (showSettings) {
    return <SettingProfileScreen onClose={() => setShowSettings(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0088FF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color="white" />
          <Text style={styles.searchText}>Tìm kiếm</Text>
        </View>
        <TouchableOpacity onPress={toggleSettings}>
          <Icon name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={navigateToProfile}
        >
          <Image source={{ uri: formData.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {formData.surname} {formData.firstname}
            </Text>
            <Text style={styles.profileViewText}>Xem trang cá nhân</Text>
          </View>
          <View style={styles.profileIcons}>
            <Icon name="people" size={24} color="#0088FF" />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Menu Items */}
        {renderMenuItem(
          <MaterialIcon name="briefcase-outline" size={24} color="#0088FF" />,
          "zBusiness",
          "Quản lý và khám phá bộ tính năng zBusiness"
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <MaterialIcon name="cloud-outline" size={24} color="#0088FF" />,
          "zCloud",
          "Không gian lưu trữ dữ liệu trên đám mây",
          true
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <FeatherIcon name="edit" size={24} color="#0088FF" />,
          "zStyle – Nổi bật trên Zalo",
          "Hình nền và nhạc cho cuộc gọi Zalo"
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <MaterialIcon name="cloud-outline" size={24} color="#0088FF" />,
          "Cloud của tôi",
          "Lưu trữ các tin nhắn quan trọng",
          true
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <MaterialIcon name="cellphone" size={24} color="#0088FF" />,
          "Dữ liệu trên máy",
          "Quản lý dữ liệu Zalo của bạn",
          true
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <MaterialIcon name="qrcode" size={24} color="#0088FF" />,
          "Ví QR",
          "Lưu trữ và xuất trình các mã QR quan trọng"
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <MaterialIcon name="shield-outline" size={24} color="#0088FF" />,
          "Tài khoản và bảo mật",
          "",
          true
        )}

        <View style={styles.divider} />

        {renderMenuItem(
          <MaterialIcon name="lock-outline" size={24} color="#0088FF" />,
          "Quyền riêng tư",
          "",
          true
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0088FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchText: {
    color: "white",
    fontSize: 18,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileViewText: {
    color: "#666666",
    marginTop: 4,
  },
  profileIcons: {
    flexDirection: "row",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 16,
  },
  menuItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  menuIconContainer: {
    width: 30,
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuDescription: {
    color: "#666666",
    marginTop: 2,
    fontSize: 14,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default MenuProfileScreen;
