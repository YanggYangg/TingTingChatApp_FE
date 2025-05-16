import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';

interface Media {
  id: string;
  messageId: string;
  urlIndex: number;
  linkURL: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date: string;
  sender: string;
  userId: string;
}

interface Props {
  conversationId: string;
  userId: string;
  socket: any; // Replace with proper Socket.IO type if available
  otherUser?: { firstname: string; surname: string; avatar?: string } | null;
  isVisible: boolean;
  onClose: () => void;
  onDelete?: (items: { messageId: string; urlIndex: number }[]) => void;
  onDataUpdated?: () => void; // Added for consistency with other components
}


const StoragePage: React.FC<Props> = ({
  conversationId,
  userId,
  socket,
  otherUser,
  isVisible,
  onClose,
  onDelete,
  onDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'files' | 'links'>('images');
  const [filterSender, setFilterSender] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  const gridVideoRefs = useRef<Record<string, Video>>({});
  const fullScreenVideoRef = useRef<Video>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  const [data, setData] = useState<{
    images: Media[];
    files: Media[];
    links: Media[];
  }>({
    images: [],
    files: [],
    links: [],
  });

  const fetchData = () => {
    if (!conversationId || !socket) {
      console.warn('conversationId or socket not provided.');
      setData({ images: [], files: [], links: [] });
      return;
    }

    socket.emit('getChatMedia', { conversationId }, (response: any) => {
      if (response && response.success) {
        setData((prev) => ({
          ...prev,
          images: formatData(response.data, 'media'),
        }));
        console.log('Media data:', formatData(response.data, 'media'));
      } else {
        console.error('Error fetching media:', response?.message);
        Alert.alert('Error', 'Could not load media. Please try again.');
      }
    });

    socket.emit('getChatFiles', { conversationId }, (response: any) => {
      if (response && response.success) {
        setData((prev) => ({
          ...prev,
          files: formatData(response.data, 'file'),
        }));
        console.log('Files data:', formatData(response.data, 'file'));
      } else {
        console.error('Error fetching files:', response?.message);
        Alert.alert('Error', 'Could not load files. Please try again.');
      }
    });

    socket.emit('getChatLinks', { conversationId }, (response: any) => {
      if (response && response.success) {
        setData((prev) => ({
          ...prev,
          links: formatData(response.data, 'link'),
        }));
        console.log('Links data:', formatData(response.data, 'link'));
      } else {
        console.error('Error fetching links:', response?.message);
        Alert.alert('Error', 'Could not load links. Please try again.');
      }
    });
  };

  useEffect(() => {
    if (!socket || !conversationId || !isVisible) return;

    socket.on('chatMedia', (media: any[]) => {
      setData((prev) => ({
        ...prev,
        images: formatData(media, 'media'),
      }));
      if (onDataUpdated) onDataUpdated();
    });

    socket.on('chatFiles', (files: any[]) => {
      setData((prev) => ({
        ...prev,
        files: formatData(files, 'file'),
      }));
      if (onDataUpdated) onDataUpdated();
    });

    socket.on('chatLinks', (links: any[]) => {
      setData((prev) => ({
        ...prev,
        links: formatData(links, 'link'),
      }));
      if (onDataUpdated) onDataUpdated();
    });

    socket.on('messageDeleted', (data: any) => {
      setData((prev) => ({
        images: prev.images.filter((item) => item.messageId !== data.messageId),
        files: prev.files.filter((item) => item.messageId !== data.messageId),
        links: prev.links.filter((item) => item.messageId !== data.messageId),
      }));
      if (onDataUpdated) onDataUpdated();
    });

    socket.on('error', (error: any) => {
      console.error('[Socket.IO] Error:', error.message);
      Alert.alert('Error', 'An error occurred. Please try again.');
    });

    fetchData();

    return () => {
      socket.off('chatMedia');
      socket.off('chatFiles');
      socket.off('chatLinks');
      socket.off('messageDeleted');
      socket.off('error');
    };
  }, [socket, conversationId, isVisible, onDataUpdated]);

  const formatData = (items: any[], dataType: string): Media[] => {
    if (!Array.isArray(items)) {
      console.warn(`Data ${dataType} is not an array:`, items);
      return [];
    }

    return items
      .flatMap((item: any) => {
        const urls = Array.isArray(item?.linkURL)
          ? item.linkURL.filter((url: string) => url && typeof url === 'string')
          : typeof item?.linkURL === 'string'
          ? [item.linkURL]
          : [];
        if (urls.length === 0) {
          console.warn(`Message ${item._id} lacks valid linkURL:`, item);
          return [];
        }

        return urls.map((url: string, urlIndex: number) => ({
          id: `${item?._id}_${urlIndex}`,
          messageId: item?._id,
          urlIndex,
          linkURL: url,
          // name: item?.content || `Media_${urlIndex + 1}`,
          type:
            item?.messageType === 'video'
              ? 'video'
              : item?.messageType === 'file'
              ? 'file'
              : item?.messageType === 'link'
              ? 'link'
              : 'image',
          date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Unknown',
          sender:
            otherUser && item?.userId !== userId
              ? `${otherUser.firstname} ${otherUser.surname}`.trim()
              : item?.userId === userId
              ? 'You'
              : item?.userId || 'Unknown sender',
          userId: item?.userId || 'unknown',
        }));
      })
      .filter((item) => item.linkURL);
  };

  useEffect(() => {
    if (fullScreenMedia) {
      Object.values(gridVideoRefs.current).forEach((ref) => {
        ref?.pauseAsync().catch(() => {});
      });
    } else {
      fullScreenVideoRef.current?.pauseAsync().catch(() => {});
      Object.values(gridVideoRefs.current).forEach((ref) => {
        ref?.pauseAsync().catch(() => {});
      });
    }
  }, [fullScreenMedia]);

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'No items selected for deletion.');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedItems.length} item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const itemsToDelete = selectedItems.map((item) => ({
              messageId: item.messageId,
              urlIndex: item.urlIndex,
            }));

            socket.emit('deleteMessage', { messageIds: itemsToDelete.map((item) => item.messageId) }, (response: any) => {
              if (response && response.success) {
                console.log('Items deleted successfully:', response.data);
                setData((prev) => ({
                  images: prev.images.filter(
                    (item) => !itemsToDelete.some((d) => d.messageId === item.messageId && d.urlIndex === item.urlIndex)
                  ),
                  files: prev.files.filter(
                    (item) => !itemsToDelete.some((d) => d.messageId === item.messageId && d.urlIndex === item.urlIndex)
                  ),
                  links: prev.links.filter(
                    (item) => !itemsToDelete.some((d) => d.messageId === item.messageId && d.urlIndex === item.urlIndex)
                  ),
                }));
                setSelectedItems([]);
                setIsSelecting(false);
                if (onDelete) {
                  onDelete(itemsToDelete);
                }
                Alert.alert('Success', 'Items deleted successfully.');
              } else {
                console.error('Error deleting items:', response?.message);
                Alert.alert('Error', 'Could not delete items. Please try again.');
              }
            });
          },
        },
      ]
    );
  };

  const downloadMedia = async (url: string, type: string) => {
    try {
      const fileName = url.split('/').pop() || (type === 'image' ? 'downloaded_image.jpg' : type === 'video' ? 'downloaded_video.mp4' : 'downloaded_file');
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      if (type === 'image' || type === 'video') {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted) {
          await MediaLibrary.createAssetAsync(uri);
          Alert.alert('Success', `${type === 'image' ? 'Image' : 'Video'} has been saved to gallery!`);
        } else {
          Alert.alert('Error', 'No permission to access gallery for saving.');
        }
      } else {
        Alert.alert('Success', `File "${fileName}" has been downloaded. Check your Files app.`);
        openFile(uri, fileName);
      }
    } catch (error: any) {
      console.error(`Download ${type} failed:`, error.message || error);
      Alert.alert('Error', `Could not download ${type}. Please try again.`);
    }
  };

  const openFile = async (fileUri: string, fileName: string) => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        const mimeType = getMimeTypeFromExtension(fileName);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: mimeType || 'application/octet-stream',
        });
      } catch (error: any) {
        console.error('Error opening file on Android:', error);
        Alert.alert('Error', `Could not open file "${fileName}".`);
      }
    } else if (Platform.OS === 'ios') {
      Alert.alert('Open File', `File "${fileName}" has been downloaded. Check your Files app.`);
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

  const handleOpenLink = (linkURL: string) => {
    if (!linkURL || linkURL === '#') {
      Alert.alert('Error', 'Invalid link.');
      return;
    }
    Linking.openURL(linkURL).catch((err) => Alert.alert('Error', 'Could not open link: ' + err.message));
  };

  const filteredData = useMemo(() => {
    const currentData = activeTab === 'images' ? data.images : activeTab === 'files' ? data.files : data.links;

    return currentData
      .filter((item) => {
        if (filterSender !== 'All' && item.sender !== filterSender) {
          return false;
        }
        if (startDate && new Date(item.date) < startDate) {
          return false;
        }
        if (endDate && new Date(item.date) > endDate) {
          return false;
        }
        if (isSearching && searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTab, data, filterSender, startDate, endDate, searchText, isSearching]);

  const uniqueSenders = useMemo(() => {
    const senders = new Set<string>();
    [...data.images, ...data.files, ...data.links].forEach((item) => senders.add(item.sender));
    return ['All', ...Array.from(senders)];
  }, [data]);

  const toggleSelectItem = (item: Media) => {
    if (selectedItems.some((selected) => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter((selected) => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(filteredData[index]);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setIsSearching(text.length > 0);
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose} onBackButtonPress={onClose} style={styles.modal}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kho lưu trữ</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'images' && styles.activeTab]}
            onPress={() => setActiveTab('images')}
          >
            <Text style={[styles.tabText, activeTab === 'images' && styles.activeTabText]}>Images/Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'files' && styles.activeTab]}
            onPress={() => setActiveTab('files')}
          >
            <Text style={[styles.tabText, activeTab === 'files' && styles.activeTabText]}>Files</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'links' && styles.activeTab]}
            onPress={() => setActiveTab('links')}
          >
            <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>Links</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>

          <View style={styles.filterRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filterSender}
                onValueChange={(value) => setFilterSender(value)}
                style={styles.picker}
              >
                {uniqueSenders.map((sender) => (
                  <Picker.Item key={sender} label={sender} value={sender} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => setShowDateFilter(!showDateFilter)}
            >
              <Ionicons name="calendar-outline" size={20} color="#007bff" />
              <Text style={styles.dateFilterText}>Date Filter</Text>
            </TouchableOpacity>
          </View>

          {showDateFilter && (
            <View style={styles.dateFilterContainer}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text>{startDate ? startDate.toISOString().split('T')[0] : 'Start Date'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text>{endDate ? endDate.toISOString().split('T')[0] : 'End Date'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                <Text style={styles.clearDateText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, isSelecting && styles.actionButtonActive]}
            onPress={() => {
              setIsSelecting(!isSelecting);
              setSelectedItems([]);
            }}
          >
            <Text style={styles.actionButtonText}>{isSelecting ? 'Hủy' : 'Chọn'}</Text>
          </TouchableOpacity>
          {isSelecting && selectedItems.length > 0 && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSelected}>
              <Text style={styles.deleteButtonText}>Xóa ({selectedItems.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.contentContainer}>
          {filteredData.length === 0 ? (
            <Text style={styles.noDataText}>No {activeTab} available.</Text>
          ) : (
            <View style={activeTab === 'images' ? styles.grid : styles.list}>
              {filteredData.map((item) => (
                <View key={item.id} style={activeTab === 'images' ? styles.gridItem : styles.listItem}>
                  {isSelecting && (
                    <TouchableOpacity
                      style={styles.selectCheckbox}
                      onPress={() => toggleSelectItem(item)}
                    >
                      <Ionicons
                        name={selectedItems.some((selected) => selected.id === item.id) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={selectedItems.some((selected) => selected.id === item.id) ? '#007bff' : '#666'}
                      />
                    </TouchableOpacity>
                  )}
                  {activeTab === 'images' && (
                    <>
                      {item.type === 'image' ? (
                        <TouchableOpacity onPress={() => setFullScreenMedia(item)}>
                          <Image
                            source={{ uri: item.linkURL }}
                            style={styles.mediaItem}
                            onError={(e) => console.error(`Error loading image ${item.id}:`, e)}
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => setFullScreenMedia(item)}>
                          <Video
                            ref={(ref) => (gridVideoRefs.current[item.id] = ref)}
                            source={{ uri: item.linkURL }}
                            style={styles.mediaItem}
                            useNativeControls={false}
                            isMuted={true}
                            resizeMode="cover"
                            onError={(e) => {
                              console.error(`Error loading video ${item.id}:`, e);
                              setVideoError('Could not load video.');
                            }}
                          />
                          <View style={styles.playIconContainer}>
                            <Ionicons name="play-circle-outline" size={30} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                  {activeTab === 'files' && (
                    <View style={styles.fileItem}>
                      <Ionicons name="document-outline" size={24} color="#007bff" style={styles.fileIcon} />
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName}>{item.name}</Text>
                        <Text style={styles.fileMeta}>
                          {item.sender} • {item.date}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => downloadMedia(item.linkURL, 'file')}
                      >
                        <Ionicons name="download-outline" size={24} color="#007bff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {activeTab === 'links' && (
                    <View style={styles.linkItem}>
                      <View style={styles.linkInfo}>
                        <Text style={styles.linkName}>{item.name}</Text>
                        <TouchableOpacity onPress={() => handleOpenLink(item.linkURL)}>
                          <Text style={styles.linkUrl}>{item.linkURL}</Text>
                        </TouchableOpacity>
                        <Text style={styles.linkMeta}>
                          {item.sender} • {item.date}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.linkActionButton}
                        onPress={() => handleOpenLink(item.linkURL)}
                      >
                        <Ionicons name="link" size={24} color="#007bff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Modal
          isVisible={!!fullScreenMedia}
          onBackdropPress={() => setFullScreenMedia(null)}
          onBackButtonPress={() => setFullScreenMedia(null)}
          style={styles.fullScreenModal}
        >
          {fullScreenMedia && (
            <View style={styles.fullScreenContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenMedia(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadMedia(fullScreenMedia.linkURL, fullScreenMedia.type)}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <Swiper
                index={currentIndex}
                onIndexChanged={handleSwipe}
                loop={false}
                showsPagination={false}
                scrollEnabled={true}
              >
                {filteredData
                  .filter((item) => item.type !== 'file' && item.type !== 'link')
                  .map((item) => (
                    <View key={item.id} style={styles.swiperSlide}>
                      {item.type === 'image' ? (
                        <Image
                          source={{ uri: item.linkURL }}
                          style={styles.fullScreenMedia}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.fullScreenVideoContainer}>
                          <Video
                            ref={item.id === fullScreenMedia.id ? fullScreenVideoRef : null}
                            source={{ uri: item.linkURL }}
                            style={styles.fullScreenMedia}
                            useNativeControls
                            resizeMode="contain"
                            onError={(e) => {
                              console.error(`Error loading full-screen video ${item.id}:`, e);
                              setVideoError('Could not load video.');
                            }}
                          />
                        </View>
                      )}
                      <Text style={styles.mediaName}>{item.name}</Text>
                    </View>
                  ))}
              </Swiper>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  filterContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    marginRight: 10,
  },
  picker: {
    height: 40,
    fontSize: 14,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f0ff',
    padding: 10,
    borderRadius: 5,
  },
  dateFilterText: {
    marginLeft: 5,
    color: '#007bff',
    fontSize: 14,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  datePickerButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
  },
  clearDateButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  clearDateText: {
    color: '#333',
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  actionButtonActive: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 14,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#ff4444',
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  list: {
    gap: 10,
  },
  gridItem: {
    width: '30%',
    position: 'relative',
  },
  listItem: {
    position: 'relative',
  },
  mediaItem: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 12,
    color: '#666',
  },
  downloadButton: {
    padding: 5,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  linkInfo: {
    flex: 1,
  },
  linkName: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    color: '#007bff',
  },
  linkMeta: {
    fontSize: 12,
    color: '#666',
  },
  linkActionButton: {
    padding: 5,
  },
  selectCheckbox: {
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 10,
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModal: {
    margin: 0,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
    width: '100%',
    height: '90%',
  },
  fullScreenVideoContainer: {
    width: '100%',
    height: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  downloadButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  swiperSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaName: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default StoragePage;