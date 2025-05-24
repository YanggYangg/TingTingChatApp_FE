import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newImage?: string, conversationId?: string) => void;
  initialName?: string;
  initialImage?: string;
  conversationId?: string;
  userId?: string;
}

const EditNameModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialName, initialImage, conversationId, userId }) => {
  const [name, setName] = useState(initialName || '');
  const [image, setImage] = useState(initialImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const navigation = useNavigation();

  const DEFAULT_IMAGE_URL = 'https://media.istockphoto.com/id/1223631367/vi/vec-to/nh%C3%B3m-ng%C6%B0%E1%BB%9Di-%C4%91a-v%C4%83n-h%C3%B3a-%C4%91ang-%C4%91%E1%BB%A9ng-c%C3%B9ng-nhau-%C4%91%E1%BB%99i-ng%C5%A9-%C4%91%E1%BB%93ng-nghi%E1%BB%87p-sinh-vi%C3%AAn-%C4%91%C3%A0n-%C3%B4ng-v%C3%A0-ph%E1%BB%A5-n%E1%BB%AF.jpg?s=612x612&w=0&k=20&c=Mxt-YtYW5vkwUFWABGNQlAlXapt8EwmJNxKWs_h7DKE=';

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Cần cấp quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
      console.error('Error picking image:', error);
    }
  };

  const uploadToS3 = async (file: { uri: string; name: string; type: string }, retries = 2) => {
    const formData = new FormData();
    formData.append('media', {
      uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
      name: file.name,
      type: file.type,
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Uploading to http://192.168.24.106:5000`);
        const res = await fetch('http://192.168.24.106:5000/messages/sendMessageWithMedia', {
          method: 'POST',
          body: formData,
        });

        const text = await res.text();
        console.log('Response status:', res.status);
        console.log('Raw response text:', text);

        if (!res.ok) {
          console.error(`Upload failed with status ${res.status}: ${res.statusText}`);
          throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }

        try {
          const data = JSON.parse(text);
          if (!data.linkURL) {
            throw new Error('Response missing linkURL');
          }
          return data.linkURL;
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr);
          throw new Error('Invalid JSON response');
        }
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          throw new Error(
            err.message.includes('Network request failed')
              ? 'Không thể kết nối tới server. Vui lòng kiểm tra mạng hoặc server.'
              : err.message
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên nhóm không được để trống.');
      return;
    }

    if (!conversationId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID cuộc trò chuyện.');
      return;
    }

    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID người dùng.');
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = image;

      if (image && image.startsWith('file://')) {
        const filename = image.split('/').pop() || 'group_image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

        // Kiểm tra định dạng file
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(type)) {
          Alert.alert('Lỗi', 'Định dạng ảnh không được hỗ trợ. Vui lòng chọn JPEG, PNG, GIF hoặc WEBP.');
          setIsUploading(false);
          return;
        }

        const file = {
          uri: image,
          name: filename,
          type,
        };

        console.log('Preparing to upload image:', { uri: image, name: filename, type });
        imageUrl = await uploadToS3(file);
        console.log('Uploaded image URL:', imageUrl);
      } else {
        console.log('No new image selected, using existing or default image');
      }

      // Sử dụng DEFAULT_IMAGE_URL nếu không có imageUrl
      const finalImageUrl = imageUrl && imageUrl !== '' ? imageUrl : DEFAULT_IMAGE_URL;

      console.log('Calling onSave with:', { name: name.trim(), finalImageUrl, conversationId });
      onSave(name.trim(), finalImageUrl, conversationId);

      setIsUploading(false);
      onClose();
    } catch (error) {
      setIsUploading(false);
      console.error('Error uploading image or saving:', error);
      if (error.message.includes('Network request failed')) {
        Alert.alert('Lỗi', 'Không thể kết nối tới server. Vui lòng kiểm tra mạng hoặc server.');
      } else if (error.response?.status === 401) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Lỗi', 'Không thể lưu thông tin nhóm. Vui lòng thử lại.');
      }
    }
  };

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Sửa thông tin nhóm</Text>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image || DEFAULT_IMAGE_URL }}
            style={styles.groupImage}
          />
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Feather name="camera" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên nhóm mới"
          editable={!isUploading}
        />
        <TouchableOpacity
          style={[styles.saveButton, isUploading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isUploading}
        >
          <Text style={styles.saveButtonText}>{isUploading ? 'Đang lưu...' : 'Lưu'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isUploading}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#a0c4ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ff0000',
    fontSize: 16,
  },
});

export default EditNameModal;