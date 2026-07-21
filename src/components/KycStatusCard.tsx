import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {fetchKycState, KycState} from '../api/kyc';
import Icon from './Icon';
import {font} from '../theme';

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

/** Carte de statut KYC (profil) — reproduit KycStatusCard de la PWA. */
export default function KycStatusCard() {
  const [s, setS] = useState<KycState | null>(null);

  useEffect(() => {
    fetchKycState().then(setS).catch(() => {});
  }, []);

  if (!s) return null;

  const open = () => { if (s.verify_url) Linking.openURL(s.verify_url); };

  const cfg = {
    verified: {icon: 'checkmark-circle', ic: '#16a34a', iconBg: '#dcfce7', bg: '#f0fdf4', bd: '#bbf7d0', title: '#166534', t: 'Identité vérifiée', sub: 'Ton identité est confirmée.'},
    submitted: {icon: 'time', ic: '#d97706', iconBg: '#fef3c7', bg: '#fffbeb', bd: '#fde68a', title: '#92400e', t: 'Vérification en cours', sub: 'Nous examinons ta pièce.'},
    pending: {icon: 'shield-checkmark', ic: '#16a34a', iconBg: '#dcfce7', bg: '#fff', bd: '#f3f4f6', title: '#111827', t: 'Vérifie ton identité', sub: ''},
    rejected: {icon: 'alert-circle', ic: '#dc2626', iconBg: '#fee2e2', bg: '#fef2f2', bd: '#fecaca', title: '#b91c1c', t: 'Vérification refusée', sub: 'Reprends la vérification.'},
  }[s.kyc_status];

  const d = daysLeft(s.deadline);
  const actionable = s.kyc_status === 'pending' || s.kyc_status === 'rejected';
  const subText = s.kyc_status === 'pending'
    ? (d !== null ? `Il te reste ${d} jour${d > 1 ? 's' : ''} pour vérifier ton identité.` : 'Vérification requise pour recevoir des campagnes.')
    : cfg.sub;

  return (
    <TouchableOpacity
      style={[styles.card, {backgroundColor: cfg.bg, borderColor: cfg.bd}]}
      onPress={actionable ? open : undefined}
      disabled={!actionable}
      activeOpacity={actionable ? 0.85 : 1}>
      <View style={[styles.iconWrap, {backgroundColor: cfg.iconBg}]}>
        <Icon name={cfg.icon} size={22} color={cfg.ic} />
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.title, {color: cfg.title}]}>{cfg.t}</Text>
        <Text style={styles.sub}>{subText}</Text>
      </View>
      {actionable && <Text style={styles.action}>Vérifier ›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  iconWrap: {width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  title: {fontWeight: font.weight.bold, fontSize: font.size.sm},
  sub: {color: '#6b7280', fontSize: font.size.xs, marginTop: 2},
  action: {color: '#16a34a', fontSize: font.size.xs, fontWeight: font.weight.bold},
});
