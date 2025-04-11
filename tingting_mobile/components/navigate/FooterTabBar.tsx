import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const FooterTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
          ChatScreen: 'chatbubble-outline',
          ContactScreen: 'people-outline',
          DiaryScreen: 'time-outline',
          ProfileScreen: 'person-outline',
        };

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={iconMap[route.name] || 'ellipse-outline'}
              size={24}
              color={isFocused ? '#007AFF' : '#888'}
            />
            <Text style={[styles.label, isFocused && styles.activeLabel]}>
              {typeof label === 'string' ? label : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default FooterTabBar;
