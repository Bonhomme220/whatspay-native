import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {colors, font} from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>W</Text>
      </View>
      <Text style={styles.brand}>WhatsPAY</Text>
      <ActivityIndicator color={colors.primary} style={{marginTop: 16}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg},
  logo: {width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  logoText: {color: colors.textOnPrimary, fontSize: 38, fontWeight: font.weight.bold},
  brand: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginTop: 12},
});
