import React from 'react';
import { View, Text , TouchableOpacity, StyleSheet } from 'react-native';

function  Welcome () {
    return ( 
        <View style={styles.container}>
           <Text>Welcome</Text>
           <View style={styles.buttonContainer}>
            <TouchableOpacity>Đăng nhập</TouchableOpacity>
            <TouchableOpacity>Đăng nhập</TouchableOpacity>
           </View>
        </View>
     );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
    buttonContainer:{

    }
});

export default Welcome;