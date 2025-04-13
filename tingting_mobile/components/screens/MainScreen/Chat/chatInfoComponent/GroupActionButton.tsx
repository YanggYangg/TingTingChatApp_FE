import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon: 'mute' | 'unmute' | 'pin' | 'unpin' | 'add' | 'settings';
  text: string;
  onClick: () => void;
  isActive?: boolean; // New prop to determine if the background should be blue
}

const IoniconsMap: { [key: string]: JSX.Element } = {
  mute: <Ionicons name="notifications-off-outline" size={20} color="#000" />,
  unmute: <Ionicons name="notifications-outline" size={20} color="#000" />,
  pin: <Ionicons name="pin" size={20} color="#000" />,
  unpin: <Ionicons name="pin-outline" size={20} color="#000" />,
  add: <Ionicons name="person-add" size={20} color="#000" />,
  settings: <Ionicons name="settings" size={20} color="#000" />,
};

const GroupActionButton: React.FC<Props> = ({ icon, text, onClick, isActive = false }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onClick}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isActive ? '#1e90ff' : '#f0f0f0' }, // Blue when active, gray when inactive
        ]}
      >
        {IoniconsMap[icon] || <Ionicons name="help-circle-outline" size={20} color="#000" />}
      </View>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    padding: 10,
    gap: 5,
  },
  iconContainer: {
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});

export default GroupActionButton;