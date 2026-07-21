import React from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';
import {colors} from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator color={colors.primary} style={{marginTop: 20}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg},
  logo: {width: 220, height: 74},
});
