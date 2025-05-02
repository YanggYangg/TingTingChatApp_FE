import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StoragePage from './StoragePage';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

interface File {
  id: string;
  linkURL: string;
  content: string;
  createdAt: string;
  _id: string;
}

interface Props {
  conversationId: string;
  userId: string;
  socket: any; // Replace with proper Socket.IO type if available
  onDeleteFile?: (fileId: string) => void;
  onForwardFile?: (file: File, targetConversations: string[], content: string) => void;
}

const GroupFile: React.FC<Props> = ({ conversationId, userId, socket, onDeleteFile, onForwardFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToForward, setFileToForward] = useState<File | null>(null);
  const [messageIdToForward, setMessageIdToForward] = useState<string | null>(null);

  const fetchFiles = () => {
    if (!conversationId || !socket) {
      console.warn('conversationId or socket not provided.');
      setFiles([]);
      return;
    }

    socket.emit('getChatFiles', { conversationId }, (response: any) => {
      if (response && response.success) {
        const fileData = Array.isArray(response.data) ? response.data : [];
        console.log('[Socket.IO] Response (get files):', fileData);
        if (Array.isArray(fileData)) {
          const sortedFiles = fileData.sort(
            (a: File, b: File) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFiles(
            sortedFiles.slice(0, 3).map((file: File) => ({
              ...file,
              id: file?._id || file?.id,
            }))
          );
        } else {
          setFiles([]);
          console.warn('Socket.IO did not return a valid array.');
        }
      } else {
        setFiles([]);
        console.error('Error fetching file list:', response?.message);
        Alert.alert('Error', 'Could not load file list. Please try again.');
      }
    });
  };

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on('chatFiles', (updatedFiles: File[]) => {
      console.log('[Socket.IO] Updated file list:', updatedFiles);
      if (Array.isArray(updatedFiles)) {
        const sortedFiles = updatedFiles.sort(
          (a: File, b: File) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setFiles(
          sortedFiles.slice(0, 3).map((file: File) => ({
            ...file,
            id: file?._id || file?.id,
          }))
        );
      } else {
        setFiles([]);
        console.warn('Invalid update data:', updatedFiles);
      }
    });

    socket.on('error', (error: any) => {
      console.error('[Socket.IO] Error:', error.message);
      Alert.alert('Error', 'An error occurred. Please try again.');
    });

    fetchFiles();

    return () => {
      socket.off('chatFiles');
      socket.off('error');
    };
  }, [conversationId, socket]);

  const handleDownload = async (file: File) => {
    if (!file?.linkURL) {
      Alert.alert('Error', 'No file link available for download.');
      return;
    }

    const fileName = file.linkURL.split('/').pop() || file.content || 'downloaded_file';
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    try {
      const { uri } = await FileSystem.downloadAsync(file.linkURL, fileUri);
      Alert.alert('Success', `File "${fileName}" has been downloaded.`);
      console.log('File saved at:', uri);
      openFile(uri, fileName);
    } catch (downloadError: any) {
      console.error('Error downloading file:', downloadError.message || downloadError);
      Alert.alert('Error', `Could not download file "${fileName}". Please try again.`);
    }
  };

  const getMimeTypeFromExtension = (fileName: string): string | null => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pdf':
        return 'application/pdf';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  };

  const openFile = async (fileUri: string, fileName: string) => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        if (contentUri) {
          const mimeType = getMimeTypeFromExtension(fileName);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: mimeType || 'application/octet-stream',
          });
        } else {
          Alert.alert('Error', 'Could not create Content URI for the file.');
        }
      } catch (error: any) {
        console.error('Error opening file on Android:', error);
        Alert.alert(
          'Error',
          `Could not open file "${fileName}". Please check if you have the appropriate app installed.`
        );
      }
    } else if (Platform.OS === 'ios') {
      Alert.alert(
        'Open File',
        `File "${fileName}" has been downloaded. Please check your Files app to view it.`,
        [{ text: 'OK' }]
      );
      console.log('File saved at (iOS):', fileUri);
    }
  };

  const handleForwardClick = (fileItem: File) => {
    setFileToForward(fileItem);
    setMessageIdToForward(fileItem._id);
    setIsShareModalOpen(true);
    console.log('Request to forward file:', fileItem, 'messageId:', fileItem._id);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setFileToForward(null);
    setMessageIdToForward(null);
  };

  const handleFileShared = (targetConversations: string[], shareContent: string) => {
    if (!fileToForward?._id) {
      console.error('No message ID available for forwarding.');
      Alert.alert('Error', 'No message ID available for forwarding.');
      return;
    }
    if (!userId) {
      console.error('No user ID available for forwarding.');
      Alert.alert('Error', 'No user ID available for forwarding.');
      return;
    }
    if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
      console.warn('No conversations selected for forwarding.');
      Alert.alert('Error', 'No conversations selected for forwarding.');
      return;
    }

    socket.emit(
      'forwardMessage',
      {
        messageId: fileToForward._id,
        targetConversationIds: targetConversations,
        userId: userId,
        content: shareContent,
      },
      (response: any) => {
        if (response && response.success) {
          console.log(`Forwarded file to ${response.data.length} conversations.`);
          setIsShareModalOpen(false);
          setFileToForward(null);
          setMessageIdToForward(null);
          if (onForwardFile) {
            onForwardFile(fileToForward, targetConversations, shareContent);
          }
          Alert.alert('Success', 'File forwarded successfully.');
        } else {
          console.error('Error forwarding file:', response?.message);
          Alert.alert('Error', 'Could not forward file. Please try again.');
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Files</Text>
      <View style={styles.fileList}>
        {files.length > 0 ? (
          files.map((file, index) => (
            <View key={file.id || index} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Ionicons name="document-outline" size={16} color="#1e90ff" style={{ marginRight: 10, paddingBottom: 4, paddingTop: 5 }} />
                <Text style={styles.fileName}>{file.content || 'No name'}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleForwardClick(file)} style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color="#1e90ff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDownload(file)} style={styles.actionButton}>
                  <Ionicons name="download-outline" size={20} color="#1e90ff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>No files available.</Text>
        )}
      </View>
      <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.viewAllText}>View All</Text>
      </TouchableOpacity>

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          userId={userId}
          socket={socket}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          onDataUpdated={fetchFiles}
        />
      )}

      {/* ShareModal component would need to be implemented for React Native */}
      {/* <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleFileShared}
        userId={userId}
        messageId={messageIdToForward}
        messageToForward={fileToForward}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileList: {
    gap: 4,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  fileName: {
    fontSize: 12,
    color: '#1e90ff',
    flexShrink: 1,
    marginRight: 10,
    alignItems: 'center',
    paddingBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 2,
    marginLeft: 8,
  },
  viewAllButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    borderRadius: 3,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 12,
    color: '#333',
  },
  placeholder: {
    fontSize: 12,
    color: '#666',
  },
});

export default GroupFile;