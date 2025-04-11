import React from "react";
import { View, StyleSheet } from "react-native";
import SearchHeader from "../../find/SearchHeader"; // sửa path nếu cần

interface Props {
  children: React.ReactNode;
}

const MainLayout = ({ children }: Props) => {
  return (
    <View style={styles.container}>
      <SearchHeader />
      <View style={styles.body}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
  },
});

export default MainLayout;
