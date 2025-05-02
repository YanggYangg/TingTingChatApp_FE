import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StoragePage from './StoragePage';

interface Link {
  id: string;
  title: string;
  linkURL: string;
  date: string;
  sender: string;
  messageId: string;
}

interface Props {
  conversationId: string;
  userId: string;
  socket: any; // Replace with proper Socket.IO type if available
  onDeleteLink?: (linkId: string) => void;
  onForwardLink?: (link: Link, targetConversations: string[], content: string) => void;
}

const GroupLinks: React.FC<Props> = ({ conversationId, userId, socket, onDeleteLink, onForwardLink }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [linkToForward, setLinkToForward] = useState<Link | null>(null);
  const [messageIdToForward, setMessageIdToForward] = useState<string | null>(null);

  const fetchLinks = () => {
    if (!conversationId || !socket) {
      console.warn('conversationId or socket not provided.');
      setLinks([]);
      return;
    }

    socket.emit('getChatLinks', { conversationId }, (response: any) => {
      if (response && response.success) {
        const linkData = Array.isArray(response.data) ? response.data : [];
        console.log('[Socket.IO] Response (get links):', linkData);
        if (Array.isArray(linkData)) {
          const filteredLinks = linkData
            .filter((item: any) => item?.messageType === 'link')
            .map((item: any) => ({
              id: item?._id || item?.id,
              title: item?.content || 'No title',
              linkURL: item?.linkURL || '#',
              date: item?.createdAt?.split('T')[0] || 'No date',
              sender: item?.userId || 'Unknown sender',
              messageId: item?._id,
            }));

          const sortedLinks = filteredLinks.sort((a: Link, b: Link) => {
            if (a.date && b.date) {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return 0;
          });

          setLinks(sortedLinks.slice(0, 3));
        } else {
          setLinks([]);
          console.error('Invalid data:', response);
          Alert.alert('Error', 'Could not load link list. Please try again.');
        }
      } else {
        setLinks([]);
        console.error('Error fetching link list:', response?.message);
        Alert.alert('Error', 'Could not load link list. Please try again.');
      }
    });
  };

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on('chatLinks', (updatedLinks: any[]) => {
      console.log('[Socket.IO] Updated link list:', updatedLinks);
      if (Array.isArray(updatedLinks)) {
        const filteredLinks = updatedLinks
          .filter((item) => item?.messageType === 'link')
          .map((item) => ({
            id: item?._id || item?.id,
            title: item?.content || 'No title',
            linkURL: item?.linkURL || '#',
            date: item?.createdAt?.split('T')[0] || 'No date',
            sender: item?.userId || 'Unknown sender',
            messageId: item?._id,
          }));

        const sortedLinks = filteredLinks.sort((a: Link, b: Link) => {
          if (a.date && b.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
          return 0;
        });

        setLinks(sortedLinks.slice(0, 3));
      } else {
        setLinks([]);
        console.warn('Invalid update data:', updatedLinks);
      }
    });

    socket.on('error', (error: any) => {
      console.error('[Socket.IO] Error:', error.message);
      Alert.alert('Error', 'An error occurred. Please try again.');
    });

    fetchLinks();

    return () => {
      socket.off('chatLinks');
      socket.off('error');
    };
  }, [conversationId, socket]);

  const handleOpenLink = (linkURL: string) => {
    if (!linkURL || linkURL === '#') {
      Alert.alert('Error', 'Invalid link.');
      return;
    }

    Linking.openURL(linkURL).catch((err) =>
      Alert.alert('Error', 'Could not open link: ' + err.message)
    );
  };

  const handleDeleteClick = (linkItem: Link) => {
    if (!linkItem?.id) {
      console.error('No link ID available for deletion.');
      Alert.alert('Error', 'No link ID available for deletion.');
      return;
    }

    socket.emit('deleteMessage', { messageId: linkItem.id }, (response: any) => {
      if (response && response.success) {
        console.log('Link deleted successfully:', response.data);
        if (onDeleteLink) {
          onDeleteLink(linkItem.id);
        }
        setLinks(links.filter((link) => link.id !== linkItem.id));
        Alert.alert('Success', 'Link deleted successfully.');
      } else {
        console.error('Error deleting link:', response?.message);
        Alert.alert('Error', 'Could not delete link. Please try again.');
      }
    });
  };

  const handleForwardClick = (linkItem: Link) => {
    setLinkToForward(linkItem);
    setMessageIdToForward(linkItem.messageId);
    setIsShareModalOpen(true);
    console.log('Request to forward link:', linkItem);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setLinkToForward(null);
    setMessageIdToForward(null);
  };

  const handleLinkShared = (targetConversations: string[], shareContent: string) => {
    if (!linkToForward?.messageId) {
      console.error('No message ID available for forwarding link.');
      Alert.alert('Error', 'No message ID available for forwarding.');
      return;
    }
    if (!userId) {
      console.error('No user ID available for forwarding link.');
      Alert.alert('Error', 'No user ID available for forwarding.');
      return;
    }
    if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
      console.warn('No conversations selected for forwarding link.');
      Alert.alert('Error', 'No conversations selected for forwarding.');
      return;
    }

    socket.emit(
      'forwardMessage',
      {
        messageId: linkToForward.messageId,
        targetConversationIds: targetConversations,
        userId: userId,
        content: shareContent,
      },
      (response: any) => {
        if (response && response.success) {
          console.log(`Forwarded link to ${response.data.length} conversations.`);
          setIsShareModalOpen(false);
          setLinkToForward(null);
          setMessageIdToForward(null);
          if (onForwardLink) {
            onForwardLink(linkToForward, targetConversations, shareContent);
          }
          Alert.alert('Success', 'Link forwarded successfully.');
        } else {
          console.error('Error forwarding link:', response?.message);
          Alert.alert('Error', 'Could not forward link. Please try again.');
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Links</Text>
      <View style={styles.linkList}>
        {links.length > 0 ? (
          links.map((link, index) => (
            <View key={index} style={styles.linkItem}>
              <View>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <TouchableOpacity onPress={() => handleOpenLink(link.linkURL)}>
                  <Text style={styles.linkUrl}>{link.linkURL}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleDeleteClick(link)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleForwardClick(link)} style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color="#1e90ff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenLink(link.linkURL)} style={styles.actionButton}>
                  <Ionicons name="link" size={20} color="#1e90ff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>No links available.</Text>
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
          onDataUpdated={fetchLinks}
        />
      )}

      {/* ShareModal component would need to be implemented for React Native */}
      {/* <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleLinkShared}
        userId={userId}
        messageId={messageIdToForward}
        messageToForward={linkToForward}
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
    marginBottom: 5,
  },
  linkList: {
    gap: 5,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    color: '#1e90ff',
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
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#333',
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
});

export default GroupLinks;