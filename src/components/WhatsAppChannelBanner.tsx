import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {WHATSAPP_CHANNEL_URL} from '../config';
import {colors, font, radius, spacing} from '../theme';
import {markChannelJoined, markChannelShown} from '../api/kyc';

/**
 * Prompt d'abonnement au canal WhatsApp officiel.
 * Affiché quand le dashboard renvoie show_whatsapp_channel_modal.
 * Priorité basse — à placer en bas de la pile de bannières.
 */
export default function WhatsAppChannelBanner({show}: {show?: boolean}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (show) {
      markChannelShown().catch(() => {});
    }
  }, [show]);

  if (!show || hidden) return null;

  const join = () => {
    markChannelJoined().catch(() => {});
    Linking.openURL(WHATSAPP_CHANNEL_URL);
    setHidden(true);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>📢</Text>
      <View style={{flex: 1}}>
        <Text style={styles.title}>Rejoins notre canal WhatsApp</Text>
        <Text style={styles.body}>Astuces, nouveautés et campagnes en avant-première.</Text>
        <TouchableOpacity style={styles.cta} onPress={join}>
          <Text style={styles.ctaText}>Rejoindre le canal ›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setHidden(true)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', padding: spacing.md, marginBottom: spacing.sm},
  icon: {fontSize: 20, marginTop: 1},
  title: {fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.text},
  body: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18},
  cta: {alignSelf: 'flex-start', marginTop: spacing.sm, backgroundColor: '#25D366', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm},
  ctaText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  close: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textMuted, paddingLeft: spacing.xs},
});
