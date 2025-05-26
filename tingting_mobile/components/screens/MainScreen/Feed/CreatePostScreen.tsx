import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface MediaItem {
  uri: string;
  type: "image" | "video";
}

const API_BASE_URL = "http://192.168.24.106:3006";
const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const buttonsPosition = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Xử lý sự kiện bàn phím hiện/ẩn
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsFocused(true);
        animateButtons(-50); // Di chuyển các nút lên trên
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsFocused(false);
        animateButtons(0); // Đưa các nút về vị trí ban đầu
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Hàm animation di chuyển các nút
  const animateButtons = (toValue: number) => {
    Animated.timing(buttonsPosition, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Xử lý chọn ảnh từ thư viện
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedMedia([
        ...selectedMedia,
        { uri: result.assets[0].uri, type: "image" },
      ]);
    }
  };

  // Xử lý chọn video từ thư viện
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedMedia([
        ...selectedMedia,
        { uri: result.assets[0].uri, type: "video" },
      ]);
    }
  };

  // Xử lý đăng bài
  const handlePost = async () => {
    try {
      const profileId = await AsyncStorage.getItem("userId");
      const formData = new FormData();
      formData.append("profileId", profileId || "");
      formData.append("content", text || "");
      selectedMedia.forEach((media, index) => {
        const uriParts = media.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("files", {
          uri: media.uri,
          name: `media_${index}.${fileType}`,
          type:
            media.type === "image" ? `image/${fileType}` : `video/${fileType}`,
        } as any); 
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/post`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Post created:", response.data);

      // Reset
      setText("");
      setSelectedMedia([]);
      Alert.alert("Thông báo", "Đăng bài thành công!");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.audienceSelector}>
            <Ionicons name="people" size={18} color="#000" />
            <Text style={styles.audienceText}>Tất cả bạn bè</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </View>
          <Text style={styles.subText}>Xem bởi bạn bè trên Zalo</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.textFormatButton}>
            <Ionicons name="text" size={22} color="#0084ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.colorButton}>
            <Ionicons name="color-palette" size={22} color="#0084ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handlePost}>
            <Ionicons name="send" size={22} color="#0084ff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor="#4a90e2"
            multiline
            value={text}
            onChangeText={setText}
            onFocus={() => {
              setIsFocused(true);
              animateButtons(-50);
            }}
          />
        </ScrollView>

        {/* Tag buttons */}
        {/* {isFocused && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            <TouchableOpacity style={[styles.tagButton, styles.tagButtonBlue]}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tagButton, styles.tagButtonYellow]}>
              <Text style={styles.tagText}>Young</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tagButton, styles.tagButtonRed]}>
              <Text style={styles.tagText}>School</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tagButton, styles.tagButtonBlue]}>
              <Text style={styles.tagText}>Pangolin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tagButton, styles.tagButtonGreen]}>
              <Text style={styles.tagText}>Fountain</Text>
            </TouchableOpacity>
          </ScrollView>
        )} */}

        {/* Media buttons */}
        <Animated.View style={[styles.mediaButtonsContainer]}>
          <TouchableOpacity style={styles.mediaButton}>
            <Ionicons name="musical-notes" size={20} color="#000" />
            <Text style={styles.mediaButtonText}>Nhạc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton}>
            <Ionicons name="images" size={20} color="#000" />
            <Text style={styles.mediaButtonText}>Album</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton}>
            <Ionicons name="people" size={20} color="#000" />
            <Text style={styles.mediaButtonText}>Với bạn bè</Text>
          </TouchableOpacity>
        </Animated.View>
        {/* Hiển thị media đã chọn */}
        {selectedMedia.length > 0 && (
          <View style={styles.mediaPreviewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.mediaPreview}>
                <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => {
                    const newMedia = [...selectedMedia];
                    newMedia.splice(index, 1);
                    setSelectedMedia(newMedia);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bottom toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarButton}>
            <MaterialCommunityIcons
              name="sticker-emoji"
              size={24}
              color="black"
            />
          </TouchableOpacity>

          <View style={styles.toolbarRight}>
            <TouchableOpacity style={styles.toolbarButton} onPress={pickImage}>
              <Ionicons name="image" size={24} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={pickVideo}>
              <Ionicons name="videocam" size={24} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton}>
              <Ionicons name="link" size={24} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton}>
              <Ionicons name="location" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  audienceSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  audienceText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  subText: {
    fontSize: 12,
    color: "#666",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  textFormatButton: {},
  colorButton: {},
  sendButton: {},
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  input: {
    fontSize: 18,
    color: "#4a90e2",
    padding: 15,
    minHeight: 100,
  },
  mediaPreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 10,
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  removeMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  tagButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tagButtonBlue: {
    backgroundColor: "#4a90e2",
  },
  tagButtonYellow: {
    backgroundColor: "#f5d76e",
  },
  tagButtonRed: {
    backgroundColor: "#e74c3c",
  },
  tagButtonGreen: {
    backgroundColor: "#2ecc71",
  },
  tagText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mediaButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    marginLeft: 10,
    borderColor: "#ddd",
    borderRadius: 20,
    gap: 5,
  },
  mediaButtonText: {
    fontSize: 10,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  toolbarRight: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  toolbarButton: {
    padding: 10,
  },
});

export default CreatePostScreen;
