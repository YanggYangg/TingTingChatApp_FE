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
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as FileSystem from "expo-file-system";
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
  thumbnailUri?: string; // Thêm thumbnail URI cho video
}

interface PrivacyOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const API_BASE_URL = "http://192.168.0.103:3006";

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyOption>({
    id: "public",
    label: "Tất cả bạn bè",
    description: "Xem bởi bạn bè trên Zalo",
    icon: "people"
  });
  
  const buttonsPosition = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const privacyOptions: PrivacyOption[] = [
    {
      id: "public",
      label: "Tất cả bạn bè",
      description: "Xem bởi bạn bè trên Zalo",
      icon: "people"
    },
    {
      id: "private",
      label: "Chỉ mình tôi",
      description: "Chỉ bạn có thể xem bài viết này",
      icon: "lock-closed"
    }
  ];

  // Hàm tạo thumbnail cho video
  const generateVideoThumbnail = async (videoUri: string): Promise<string | null> => {
    try {
      setIsGeneratingThumbnail(true);
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // Lấy thumbnail tại giây thứ 1
        quality: 0.8,
      });
      setIsGeneratingThumbnail(false);
      return uri;
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      setIsGeneratingThumbnail(false);
      return null;
    }
  };

  // Xử lý sự kiện bàn phím hiện/ẩn
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsFocused(true);
        animateButtons(-50);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsFocused(false);
        animateButtons(0);
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

  // Xử lý chọn privacy
  const handlePrivacySelect = (privacy: PrivacyOption) => {
    setSelectedPrivacy(privacy);
    setShowPrivacyModal(false);
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

  // Xử lý chọn video từ thư viện với thumbnail generation
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const videoUri = result.assets[0].uri;
      
      // Tạo thumbnail cho video
      const thumbnailUri = await generateVideoThumbnail(videoUri);
      
      setSelectedMedia([
        ...selectedMedia,
        { 
          uri: videoUri, 
          type: "video",
          thumbnailUri: thumbnailUri || undefined
        },
      ]);
    }
  };

  // Xử lý đăng bài với thumbnail
  const handlePost = async () => {
    try {
      const profileId = await AsyncStorage.getItem("userId");
      const formData = new FormData();
      formData.append("profileId", profileId || "");
      formData.append("content", text || "");
      formData.append("privacy", selectedPrivacy.id);
      
      // Xử lý media files và thumbnails
      for (let index = 0; index < selectedMedia.length; index++) {
        const media = selectedMedia[index];
        const uriParts = media.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        // Append main media file
        formData.append("files", {
          uri: media.uri,
          name: `media_${index}.${fileType}`,
          type: media.type === "image" ? `image/${fileType}` : `video/${fileType}`,
        } as any);

        // Append thumbnail for video
        if (media.type === "video" && media.thumbnailUri) {
          const thumbnailInfo = await FileSystem.getInfoAsync(media.thumbnailUri);
          if (thumbnailInfo.exists) {
            formData.append("thumbnails", {
              uri: media.thumbnailUri,
              name: `thumbnail_${index}.jpg`,
              type: "image/jpeg",
            } as any);
          }
        }
      }

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
      Alert.alert("Lỗi", "Không thể đăng bài. Vui lòng thử lại!");
    }
  };

  // Render media preview với thumbnail cho video
  const renderMediaPreview = (item: MediaItem, index: number) => {
    return (
      <View key={index} style={styles.mediaPreview}>
        {item.type === "video" ? (
          <View style={styles.videoPreviewContainer}>
            <Image 
              source={{ uri: item.thumbnailUri || item.uri }} 
              style={styles.mediaImage} 
            />
            <View style={styles.videoPlayIcon}>
              <Ionicons name="play-circle" size={30} color="rgba(255,255,255,0.9)" />
            </View>
            <View style={styles.videoLabel}>
              <Text style={styles.videoLabelText}>VIDEO</Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: item.uri }} style={styles.mediaImage} />
        )}
        
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
    );
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
          <TouchableOpacity 
            style={styles.audienceSelector}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Ionicons name={selectedPrivacy.icon as any} size={18} color="#000" />
            <Text style={styles.audienceText}>{selectedPrivacy.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </TouchableOpacity>
          <Text style={styles.subText}>{selectedPrivacy.description}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.sendButton, isGeneratingThumbnail && styles.disabledButton]} 
            onPress={handlePost}
            disabled={isGeneratingThumbnail}
          >
            <Ionicons name="send" size={22} color={isGeneratingThumbnail ? "#ccc" : "#0084ff"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy Selection Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPrivacyModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đối tượng</Text>
              <TouchableOpacity 
                onPress={() => setShowPrivacyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.privacyOption,
                  selectedPrivacy.id === option.id && styles.selectedPrivacyOption
                ]}
                onPress={() => handlePrivacySelect(option)}
              >
                <View style={styles.privacyOptionLeft}>
                  <View style={[
                    styles.privacyIconContainer,
                    selectedPrivacy.id === option.id && styles.selectedPrivacyIconContainer
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={selectedPrivacy.id === option.id ? "#0084ff" : "#666"} 
                    />
                  </View>
                  <View style={styles.privacyTextContainer}>
                    <Text style={[
                      styles.privacyOptionLabel,
                      selectedPrivacy.id === option.id && styles.selectedPrivacyOptionLabel
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.privacyOptionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                {selectedPrivacy.id === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#0084ff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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

        {/* Media Preview với thumbnail support */}
        {selectedMedia.length > 0 && (
          <View style={styles.mediaPreviewContainer}>
            {selectedMedia.map((item, index) => renderMediaPreview(item, index))}
          </View>
        )}

        {/* Loading indicator khi đang tạo thumbnail */}
        {isGeneratingThumbnail && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tạo thumbnail video...</Text>
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

            <TouchableOpacity 
              style={styles.toolbarButton} 
              onPress={pickVideo}
              disabled={isGeneratingThumbnail}
            >
              <Ionicons 
                name="videocam" 
                size={24} 
                color={isGeneratingThumbnail ? "#ccc" : "#666"} 
              />
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#f8f9fa",
  },
  audienceText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  subText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  sendButton: {},
  disabledButton: {
    opacity: 0.5,
  },
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
  videoPreviewContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  videoPlayIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  videoLabel: {
    position: "absolute",
    bottom: 2,
    left: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  videoLabelText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  removeMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 10,
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  modalCloseButton: {
    padding: 5,
  },
  privacyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPrivacyOption: {
    backgroundColor: "#f0f8ff",
  },
  privacyOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  selectedPrivacyIconContainer: {
    backgroundColor: "#e6f3ff",
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  selectedPrivacyOptionLabel: {
    color: "#0084ff",
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: "#666",
  },
});

export default CreatePostScreen;