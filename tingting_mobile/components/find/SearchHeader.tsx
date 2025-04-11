import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SearchHeader = () => {
    return(
        <View style={styles.container}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#888" style={styles.icon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#888"
            style={styles.input}
          />
        </View>
  
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="qr-code-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "#007AFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",  
      paddingHorizontal: 10,
    //   paddingTop: 25,
    //   paddingBottom: 8,
    height: 70,
    },
    searchBox: {
      flex: 1,
      backgroundColor: "#fff",
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      paddingHorizontal: 10,
      height: 40,
    },
    icon: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: "#000",
    },
    actions: {
      flexDirection: "row",
      marginLeft: 10,
    },
    iconButton: {
      marginLeft: 8,
    },
  });
  
  export default SearchHeader;