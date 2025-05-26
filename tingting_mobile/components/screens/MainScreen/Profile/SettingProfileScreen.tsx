import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import type React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";

const API_BASE_URL = "http://192.168.0.103:3002/api/v1";

interface SettingsScreenProps {
  onClose: () => void;
}

const SettingProfileScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const navigation = useNavigation();

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    showArrow = true
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>{icon}</View>
      <Text style={styles.settingTitle}>{title}</Text>
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

  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem("userId");
              const response = await axios.post(
                `${API_BASE_URL}/auth/sign-out`,
                userId,
                {
                  headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem(
                      "token"
                    )}`,
                  },
                  withCredentials: true,
                }
              );
              console.log("Logout response:", response.data); // Log the response data
              await AsyncStorage.clear();
              navigation.replace("Welcome");
            } catch (error) {
              console.error("Logout failed:", error); // Log any errors
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0088FF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderSettingItem(
          <MaterialIcon name="cellphone" size={24} color="#0088FF" />,
          "Dữ liệu trên máy"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon name="backup-restore" size={24} color="#0088FF" />,
          "Sao lưu và khôi phục"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon name="bell-outline" size={24} color="#0088FF" />,
          "Thông báo"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon
            name="message-text-outline"
            size={24}
            color="#0088FF"
          />,
          "Tin nhắn"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon name="phone-outline" size={24} color="#0088FF" />,
          "Cuộc gọi"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon name="clock-outline" size={24} color="#0088FF" />,
          "Nhật ký"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon name="contacts-outline" size={24} color="#0088FF" />,
          "Danh bạ"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <MaterialIcon name="palette-outline" size={24} color="#0088FF" />,
          "Giao diện và ngôn ngữ"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <Icon name="information-circle-outline" size={24} color="#0088FF" />,
          "Thông tin về Zalo"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <Icon name="help-circle-outline" size={24} color="#0088FF" />,
          "Liên hệ hỗ trợ"
        )}

        <View style={styles.divider} />

        {renderSettingItem(
          <Icon name="people-outline" size={24} color="#0088FF" />,
          "Chuyển tài khoản"
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => handleLogout()}
        >
          <Icon name="log-out-outline" size={20} color="#333333" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
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
    backgroundColor: "#0088FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    marginLeft: 8,
  },
  searchButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  settingItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  settingIconContainer: {
    width: 30,
    alignItems: "center",
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    marginHorizontal: 16,
    backgroundColor: "#F0F0F0",
    padding: 12,
    borderRadius: 24,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333333",
  },
});

export default SettingProfileScreen;
