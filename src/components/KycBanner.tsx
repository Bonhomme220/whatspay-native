import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, font, radius, spacing} from '../theme';
import {fetchKycState, KycState} from '../api/kyc';

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

/** Bannière de vérification d'identité (KYC) — autonome (GET /kyc/state). */
export default function KycBanner() {
  const [state, setState] = useState<KycState | null>(null);

  useEffect(() => {
    fetchKycState().then(setState).catch(() => {});
  }, []);

  if (!state || !state.required) return null;

  const open = () => {
    if (state.verify_url) Linking.openURL(state.verify_url);
  };

  // À corriger (renvoyée à l'utilisateur) — actionnable, avec motif
  if (state.attempt_status === 'resubmit') {
    return (
      <Banner
        tone="warn"
        icon="✏️"
        title="Vérification à corriger"
        body={`${state.reason ? state.reason + ' ' : ''}Corrige et renvoie ta pièce.`}
        cta="Corriger"
        onPress={open}
      />
    );
  }

  // En cours (soumis) — informatif, non actionnable
  if (state.kyc_status === 'submitted') {
    return (
      <View style={[styles.card, styles.warnBg]}>
        <Text style={styles.icon}>⏳</Text>
        <View style={{flex: 1}}>
          <Text style={[styles.title, styles.warnText]}>Vérification d'identité en cours</Text>
          <Text style={styles.body}>Nous examinons ta pièce. Aucune action nécessaire.</Text>
        </View>
      </View>
    );
  }

  const d = daysLeft(state.deadline);
  const rejected = state.kyc_status === 'rejected';

  return (
    <Banner
      tone={rejected ? 'danger' : 'primary'}
      icon="🛡️"
      title={rejected ? 'Vérification refusée — réessaie' : 'Vérifie ton identité'}
      body={
        rejected
          ? 'Ta dernière tentative a échoué. Reprends la vérification pour garder ton accès.'
          : d !== null
            ? `Il te reste ${d} jour${d > 1 ? 's' : ''} pour vérifier ton identité.`
            : 'Vérification requise pour continuer à recevoir des campagnes.'
      }
      cta="Vérifier"
      onPress={open}
    />
  );
}

function Banner({
  tone,
  icon,
  title,
  body,
  cta,
  onPress,
}: {
  tone: 'primary' | 'warn' | 'danger';
  icon: string;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  const toneStyle =
    tone === 'danger' ? styles.dangerBg : tone === 'warn' ? styles.warnBg : styles.primaryBg;
  const textStyle =
    tone === 'danger' ? styles.dangerText : tone === 'warn' ? styles.warnText : styles.primaryText;
  return (
    <TouchableOpacity style={[styles.card, toneStyle]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{flex: 1}}>
        <Text style={[styles.title, textStyle]}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Text style={[styles.cta, textStyle]}>{cta} ›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm},
  primaryBg: {backgroundColor: colors.primarySoft, borderColor: '#bbf7d0'},
  warnBg: {backgroundColor: colors.warningSoft, borderColor: '#fde68a'},
  dangerBg: {backgroundColor: colors.dangerSoft, borderColor: '#fecaca'},
  icon: {fontSize: 20},
  title: {fontSize: font.size.sm, fontWeight: font.weight.bold},
  primaryText: {color: colors.primaryDark},
  warnText: {color: '#92400e'},
  dangerText: {color: colors.danger},
  body: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18},
  cta: {fontSize: font.size.xs, fontWeight: font.weight.bold},
});
