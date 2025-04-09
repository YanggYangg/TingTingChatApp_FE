import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type CustomButtonProps = {
    title: string;
    backgroundColor?: string;
    textColor?: string;
    onPress?: () => void;
  };

  export default function CustomButton({
    title,
    backgroundColor = '#007AFF', // Mặc định màu xanh
    textColor = '#fff',
    onPress,
  }: CustomButtonProps) {
    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      </TouchableOpacity>
    );
  }
  
  const styles = StyleSheet.create({
    button: {
      paddingVertical: 12,
      borderRadius: 30,
      alignItems: 'center',
      marginVertical: 8,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
    },
  });