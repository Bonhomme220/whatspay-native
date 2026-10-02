import React from 'react';
import {Image, Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WHATSAPP_CHANNEL_URL} from '../config';
import {useAuth} from '../context/AuthContext';
import {font, spacing} from '../theme';

const WA_GREEN = '#25D366';

/**
 * Étape obligatoire juste après l'inscription diffuseur : aucune échappatoire (pas de
 * bouton retour/passer) — le seul moyen d'avancer est de taper le bouton, qui ouvre le
 * canal WhatsApp ET débloque l'accès au reste de l'app dans le même geste. Décision founder
 * 2026-10-02 : on ne peut pas vérifier techniquement l'adhésion réelle (pas d'API WhatsApp
 * pour ça), donc "forcer" ici veut dire forcer le passage par l'écran et l'ouverture du
 * canal, pas une preuve d'adhésion.
 */
export default function JoinWhatsAppChannelScreen() {
  const {completeWhatsAppStep} = useAuth();

  const join = () => {
    Linking.openURL(WHATSAPP_CHANNEL_URL).catch(() => {});
    completeWhatsAppStep();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📢</Text>
        </View>
        <Text style={styles.title}>Rejoins notre canal WhatsApp</Text>
        <Text style={styles.subtitle}>
          Dernière étape avant d'accéder à ton compte : rejoins le canal officiel WhatsPAY pour recevoir les astuces,
          nouveautés et campagnes en avant-première.
        </Text>
      </View>

      <TouchableOpacity style={styles.cta} onPress={join} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Rejoindre le canal WhatsApp</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#fff', paddingHorizontal: spacing.xl, justifyContent: 'space-between', paddingVertical: spacing.xxl},
  body: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  logo: {width: 160, height: 44, marginBottom: spacing.xxl},
  iconWrap: {width: 88, height: 88, borderRadius: 44, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg},
  icon: {fontSize: 40},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: '#1f2937', textAlign: 'center', marginBottom: spacing.sm},
  subtitle: {fontSize: font.size.sm, color: '#6b7280', textAlign: 'center', lineHeight: 21, paddingHorizontal: spacing.md},
  cta: {backgroundColor: WA_GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center'},
  ctaText: {color: '#fff', fontSize: font.size.md, fontWeight: font.weight.bold},
});
