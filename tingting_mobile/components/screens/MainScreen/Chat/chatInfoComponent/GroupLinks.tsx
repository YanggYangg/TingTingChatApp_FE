import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import StoragePage from './StoragePage';

interface Link {
  title: string;
  url: string;
  date: string;
  sender: string;
}

interface Props {
  conversationId: string;
}

const GroupLinks: React.FC<Props> = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const mockLinks = [
    {
      title: "Link 1",
      url: "https://example.com/link1",
      date: "2025-04-10",
      sender: "6601a1b2c3d4e5f678901238",
    },
    {
      title: "Link 2",
      url: "https://example.com/link2",
      date: "2025-04-09",
      sender: "6601a1b2c3d4e5f678901239",
    },
  ];
  useEffect(() => {
    if (!conversationId) return;

    const fetchLinks = () => {
      const sortedLinks = mockLinks.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setLinks(sortedLinks.slice(0, 3));
    };

    fetchLinks();
  }, [conversationId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liên kết</Text>
      <View style={styles.linkList}>
        {links.length > 0 ? (
          links.map((link, index) => (
            <View key={index} style={styles.linkItem}>
              <View>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(link.url)}>
                  <Text style={styles.linkUrl}>{link.url}</Text>
                </TouchableOpacity>
              </View>
              <Ionicons name="link" size={20} color="#666" />
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>Chưa có link nào.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.viewAllText}>Xem tất cả</Text>
      </TouchableOpacity>

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          links={links}
          isVisible={isOpen} // Pass isVisible to control the modal
          onClose={() => setIsOpen(false)}
        />
      )}
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