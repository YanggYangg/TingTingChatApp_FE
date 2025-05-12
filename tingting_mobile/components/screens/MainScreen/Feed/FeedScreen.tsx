import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import PostItem from "./PostItem";
import { useNavigation } from "expo-router";

// Dữ liệu mẫu cho các bài đăng
const samplePosts = [
  {
    id: "1",
    user: {
      name: "Nguyễn Thúy Tinh",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    content: "Đã thay đổi ảnh đại diện",
    images: [
      {
        uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
      },
    ],
    timestamp: "15 phút trước",
    likes: 1,
    comments: 0,
  },
  {
    id: "2",
    user: {
      name: "Mr Bình",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    content:
      "🔥 NHÀ KHU COMPOUND BIỆT LẬP SIÊU VIP – NGUYỄN TRỌNG TUYỂN, P.1, TÂN BÌNH 🔥\n💎 Hiếm – Đẹp – Giá Tốt – Khu toàn doanh nhân trí thức...",
    images: [
      {
        uri: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      },
      {
        uri: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      },
      {
        uri: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      },
      {
        uri: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      },
      {
        uri: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      },
    ],
    timestamp: "Hôm qua lúc 20:42",
    likes: 9,
    comments: 4,
    music: {
      title: "Để Mị Nói Cho Mà Nghe",
      artist: "Hoàng Thùy Linh",
    },
  },
];

const FeedScreen: React.FC = () => {
  const navigation = useNavigation();
  const navigateToCreatePost = () => {
    // Xử lý chuyển đến màn hình tạo bài đăng
    navigation.navigate('CreatePostScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tim kiếm</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={navigateToCreatePost}>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View> */}

      {/* Create Post Section */}
      <ScrollView style={styles.postsContainer}>
        <View style={styles.createPostSection}> 
          <View style={styles.userStatusContainer}>
          <TouchableOpacity onPress={() => {navigation.navigate("ProfileScreen")}}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.userAvatar}
            />
             </TouchableOpacity>
            <TouchableOpacity
              style={styles.statusInput}
              onPress={navigateToCreatePost}
            >
              <Text style={styles.statusInputText}>Hôm nay bạn thế nào?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={navigateToCreatePost}
            >
              <FontAwesome name="image" size={20} color="#4CAF50" />
              <Text style={styles.mediaButtonText}>Ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton}>
              <FontAwesome name="video-camera" size={20} color="#F44336" />
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton}>
              <FontAwesome name="image" size={20} color="#FF9800" />
              <Text style={styles.mediaButtonText}>Album</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton}>
              <FontAwesome name="music" size={20} color="#9C27B0" />
              <Text style={styles.mediaButtonText}>Nhạc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Moments Section */}
        <View style={styles.momentsSection}>
          <Text style={styles.sectionTitle}>Khoảnh khắc</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.momentsScrollView}
          >
            <TouchableOpacity style={styles.momentItem}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/men/32.jpg",
                }}
                style={styles.momentImage}
              />
              <View style={styles.createMomentButton}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
              <Text style={styles.momentName}>Tạo mới</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.momentItem}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/women/44.jpg",
                }}
                style={styles.momentImage}
              />
              <Text style={styles.momentName}>Ngọc Hân</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.momentItem}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/men/42.jpg",
                }}
                style={styles.momentImage}
              />
              <Text style={styles.momentName}>Minh Tuấn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.momentItem}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/women/22.jpg",
                }}
                style={styles.momentImage}
              />
              <Text style={styles.momentName}>Thu Hà</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Posts */}

        {samplePosts.map((post) => (
          <PostItem key={post.id} {...post} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  createPostSection: {
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    
  },
  statusInputText: {
    color: "#666",
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mediaButtonText: {
    marginLeft: 6,
    fontSize: 14,
  },
  momentsSection: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
  },
  momentsScrollView: {
    paddingLeft: 16,
  },
  momentItem: {
    alignItems: "center",
    marginRight: 16,
    width: 70,
  },
  momentImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#1E88E5",
  },
  createMomentButton: {
    position: "absolute",
    bottom: 20,
    right: 0,
    backgroundColor: "#1E88E5",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  momentName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  postsContainer: {
    flex: 1,
  },
});

export default FeedScreen;
