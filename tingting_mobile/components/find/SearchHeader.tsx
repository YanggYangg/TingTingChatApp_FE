import React, { useState }  from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


const SearchHeader = () => {
  const [isFocused, setIsFocused] = useState(false);
  
  const navigation = useNavigation<any>();


    return(
        <View style={styles.container}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#888" style={styles.icon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#888"
            style={styles.input}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} // tuỳ chọn nếu bạn muốn ẩn modal khi rời focus          
          />
        </View>
  
        <View style={styles.actions}>
          <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate("QRScannerScreen")}>
            <Ionicons name="qr-code-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {isFocused && (
  <View style={styles.searchOverlay}>
    <Text style={styles.sectionTitle}>Không có kết quả tìm kiếm !!!</Text>
  </View>
)}
     
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "#0196fc",
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
    searchOverlay: {
      position: "absolute",
      top: 70,
      left: 0,
      right: 0,
      backgroundColor: "#fff",
      padding: 10,
      zIndex: 10,
      borderTopWidth: 1,
      borderColor: "#ddd",
    },
    sectionTitle: {
      fontWeight: "bold",
      marginTop: 10,
      marginBottom: 5,
      color: "#c0c0c0",
      textAlign: "center",
    },
  });
  
  export default SearchHeader;