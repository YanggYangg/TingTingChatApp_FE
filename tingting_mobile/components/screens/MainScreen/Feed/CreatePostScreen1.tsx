import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";

const { width } = Dimensions.get("window");

interface ImageItem {
  uri: string;
  type: string;
  name: string;
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const inputRef = useRef<TextInput>(null);

  const pickImage = async () => {
    // Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Thông báo",
        "Cần cấp quyền truy cập thư viện ảnh để tiếp tục"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: "image/jpeg",
        name: `image-${Date.now()}.jpg`,
      }));

      setSelectedImages([...selectedImages, ...newImages]);
    }
  };
  const pickVideo = async () => {
    // Yêu cầu quyền truy cập thư viện video
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Thông báo",
        "Cần cấp quyền truy cập thư viện video để tiếp tục"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newVideos = result.assets.map((asset) => ({
        uri: asset.uri,
        type: "video/mp4",
        name: `video-${Date.now()}.mp4`,
      }));

      setSelectedImages([...selectedImages, ...newVideos]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const renderImageGrid = () => {
    if (selectedImages.length === 0) return null;

    if (selectedImages.length === 1) {
      // Hiển thị 1 hình ảnh với kích thước lớn
      return (
        <View style={styles.singleImageContainer}>
          <Image
            source={{ uri: selectedImages[0].uri }}
            style={styles.singleImage}
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => removeImage(0)}
          >
            <Ionicons name="close-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      );
    } else if (selectedImages.length === 2) {
      // Hiển thị 2 hình ảnh cạnh nhau
      return (
        <View style={styles.twoImagesContainer}>
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.twoImageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.twoImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    } else if (selectedImages.length === 3) {
      // Hiển thị 3 hình ảnh: 1 lớn bên trái, 2 nhỏ bên phải
      return (
        <View style={styles.threeImagesContainer}>
          <View style={styles.threeImageMainWrapper}>
            <Image
              source={{ uri: selectedImages[0].uri }}
              style={styles.threeImageMain}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(0)}
            >
              <Ionicons name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.threeImageSideContainer}>
            {selectedImages.slice(1, 3).map((image, index) => (
              <View key={index} style={styles.threeImageSideWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.threeImageSide}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index + 1)}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      );
    } else {
      // Hiển thị 4+ hình ảnh: grid 2x2 với "+n" cho các hình còn lại
      const remainingCount = selectedImages.length - 4;
      return (
        <View style={styles.multipleImagesContainer}>
          <View style={styles.multipleImagesRow}>
            {selectedImages.slice(0, 2).map((image, index) => (
              <View key={index} style={styles.multipleImageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.multipleImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.multipleImagesRow}>
            {selectedImages.slice(2, 4).map((image, index) => (
              <View key={index} style={styles.multipleImageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.multipleImage}
                />
                {index === 1 && remainingCount > 0 && (
                  <View style={styles.remainingCountOverlay}>
                    <Text style={styles.remainingCountText}>
                      +{remainingCount}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index + 2)}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons
              name="close"
              size={24}
              color="black"
              onPress={() => navigation.goBack()}
            />

            <Text style={styles.headerTitle}>Ta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.postButton}>
          <Text style={styles.postButtonText}>Đăng</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Nguyễn Văn A</Text>
            <View style={styles.privacySelector}>
              <Text style={styles.privacyText}>Công khai</Text>
              <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
            </View>
          </View>
        </View>

        {/* Status Input */}
        <TextInput
          ref={inputRef}
          style={styles.statusInput}
          placeholder="Bạn đang nghĩ gì?"
          placeholderTextColor="#888"
          multiline
          value={status}
          onChangeText={setStatus}
        />

        {/* Image Preview */}
        {renderImageGrid()}

        {/* Media Options */}
        <View style={styles.mediaOptionsContainer}>
          <Text style={styles.addToPostText}>Thêm vào bài viết</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mediaOptions}
          >
            <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
              <FontAwesome name="image" size={20} color="#4CAF50" />
              <Text style={styles.mediaOptionText}>Ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption} onPress={pickVideo}>
              <FontAwesome name="video-camera" size={20} color="#F44336" />
              <Text style={styles.mediaOptionText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption}>
              <FontAwesome name="music" size={20} color="#9C27B0" />
              <Text style={styles.mediaOptionText}>Nhạc</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption}>
              <FontAwesome name="map-marker" size={20} color="#2196F3" />
              <Text style={styles.mediaOptionText}>Vị trí</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption}>
              <FontAwesome name="smile-o" size={20} color="#FFC107" />
              <Text style={styles.mediaOptionText}>Cảm xúc</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
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
    backgroundColor: "#white",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  postButton: {
    backgroundColor: "#0D47A1",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  postButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  privacySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  privacyText: {
    fontSize: 12,
    color: "#666",
  },
  statusInput: {
    paddingHorizontal: 16,
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: "top",
  },
  mediaOptionsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  addToPostText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  mediaOptions: {
    flexDirection: "row",
  },
  mediaOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  mediaOptionText: {
    marginLeft: 6,
    fontSize: 14,
  },

  // Single image styles
  singleImageContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  singleImage: {
    width: "100%",
    height: width - 32,
    borderRadius: 8,
  },

  // Two images styles
  twoImagesContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    justifyContent: "space-between",
  },
  twoImageWrapper: {
    position: "relative",
    width: (width - 40) / 2,
    height: (width - 40) / 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  twoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  // Three images styles
  threeImagesContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    justifyContent: "space-between",
  },
  threeImageMainWrapper: {
    position: "relative",
    width: (width - 40) * 0.66,
    height: width - 40,
    borderRadius: 8,
    overflow: "hidden",
  },
  threeImageMain: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  threeImageSideContainer: {
    width: (width - 40) * 0.33,
    justifyContent: "space-between",
  },
  threeImageSideWrapper: {
    position: "relative",
    width: "100%",
    height: (width - 44) / 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  threeImageSide: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  // Multiple images styles
  multipleImagesContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  multipleImagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  multipleImageWrapper: {
    position: "relative",
    width: (width - 40) / 2,
    height: (width - 40) / 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  multipleImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  remainingCountOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  remainingCountText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  // Remove image button
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
});

export default CreatePostScreen;
