"use client";

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { ChevronRight, Check, X, Lock } from "lucide-react-native";
import axios from "axios";

type PrivacyOption = {
  id: string;
  title: string;
  description: string;
  hasSubOptions: boolean;
};

const PrivacySettings = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const [selectedOption, setSelectedOption] = useState("all_friends");
  const postId = route.params?.postId;
  const privacyOptions: PrivacyOption[] = [
    {
      id: "all_friends",
      title: "Tất cả bạn bè",
      description: "Bạn bè trên Zalo, trừ danh sách bị chặn",
      hasSubOptions: false,
    },
    {
      id: "only_me",
      title: "Mình tôi",
      description: "Chỉ mình tôi được xem",
      hasSubOptions: false,
    },
    // {
    //   id: "friends_from_contacts",
    //   title: "Bạn bè từ danh bạ",
    //   description: "Chọn bạn được xem từ danh bạ",
    //   hasSubOptions: true,
    // },
    // {
    //   id: "friends_in_groups",
    //   title: "Bạn bè trong nhóm",
    //   description: "Chọn bạn được xem từ nhóm",
    //   hasSubOptions: true,
    // },
    // {
    //   id: "friends_except",
    //   title: "Bạn bè ngoại trừ...",
    //   description: "Chọn bạn không được xem",
    //   hasSubOptions: true,
    // },
  ];

  const handleSelect = async (id: string) => {
    try {
      const mapToBackend = {
        all_friends: "public",
        only_me: "private", // nếu bạn có thêm tùy chọn này
      };

      const mappedPrivacy = mapToBackend[id];
      if (!mappedPrivacy) {
        Alert.alert("Lỗi", "Quyền riêng tư không hợp lệ.");
        return;
      }

      const res = await axios.put(
        `http://192.168.223.71:3006/api/v1/post/${postId}/privacy`,
        {
          privacy: mappedPrivacy,
        }
      );

      if (res.data.success) {
        Alert.alert("Thành công", "Đã cập nhật quyền riêng tư.");
        navigation.goBack();
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật quyền riêng tư.");
      }
    } catch (error) {
      console.error("Update privacy error:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra.");
    }
    setSelectedOption(id);
  };

  const handleSubOptionPress = (id: string) => {
    // Navigate to sub-options screen
    console.log(`Navigate to sub-options for ${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0088ff" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quyền xem</Text>
      </View>

      <View style={styles.optionsContainer}>
        {privacyOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionItem}
            onPress={() => {
              if (option.hasSubOptions) {
                handleSubOptionPress(option.id);
              } else {
                handleSelect(option.id);
              }
            }}
          >
            <View style={styles.optionLeft}>
              <View style={styles.radioContainer}>
                {selectedOption === option.id ? (
                  <View style={styles.radioSelected}>
                    <Check color="#fff" size={16} />
                  </View>
                ) : (
                  <View style={styles.radioUnselected} />
                )}
              </View>
              <View style={styles.optionTextContainer}>
                <View style={styles.titleContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  {option.id === "only_me" && (
                    <Lock color="#999" size={16} style={styles.lockIcon} />
                  )}
                </View>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
            </View>
            {option.hasSubOptions && <ChevronRight color="#999" size={20} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#0088ff",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  optionsContainer: {
    backgroundColor: "#fff",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioContainer: {
    marginRight: 12,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0088ff",
    alignItems: "center",
    justifyContent: "center",
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  optionTextContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  lockIcon: {
    marginLeft: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#999",
  },
});

export default PrivacySettings;
