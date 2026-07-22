import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot, {captureRef} from 'react-native-view-shot';
import Share from 'react-native-share';
import Icon from './Icon';
import {font} from '../theme';

const GREEN = '#16a34a';

export interface BadgeProps {
  visible: boolean;
  onClose: () => void;
  firstname?: string;
  lastname?: string;
  isAmbassador?: boolean;
  ambassadorCode?: string | null;
  completedCampaigns?: number;
  reliability?: number | null;
}

export default function ShareBadgeModal({
  visible,
  onClose,
  firstname,
  lastname,
  isAmbassador,
  ambassadorCode,
  completedCampaigns,
  reliability,
}: BadgeProps) {
  const shotRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const name = `${firstname ?? ''} ${lastname ?? ''}`.trim() || 'Diffuseur';
  const initials = ((firstname?.[0] ?? '') + (lastname?.[0] ?? '')).toUpperCase() || 'W';
  const tagline = isAmbassador ? 'Mon réseau. Mes gains.' : 'Je fais partie du mouvement.';

  const share = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(shotRef, {format: 'png', quality: 1, result: 'tmpfile'});
      await Share.open({
        url: uri.startsWith('file://') ? uri : 'file://' + uri,
        type: 'image/png',
        message: `Je monétise mes Status WhatsApp avec WhatsPAY 🚀${ambassadorCode ? `\nCode ambassadeur : ${ambassadorCode}` : ''}\nhttps://app.whatspay.africa`,
        failOnCancel: false,
      });
    } catch {
      // annulé / erreur : silencieux
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Aperçu du badge (capturé) */}
          <ViewShot ref={shotRef as any} style={styles.badge}>
            <View style={styles.badgeInner}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.tagline}>{tagline}</Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{completedCampaigns ?? 0}</Text>
                  <Text style={styles.statLabel}>Campagnes validées</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{reliability != null ? `${Math.round(reliability)}%` : '—'}</Text>
                  <Text style={styles.statLabel}>Fiabilité</Text>
                </View>
              </View>

              {isAmbassador && !!ambassadorCode && (
                <View style={styles.ambBox}>
                  <Text style={styles.ambLabel}>CODE AMBASSADEUR</Text>
                  <Text style={styles.ambCode}>{ambassadorCode}</Text>
                </View>
              )}

              <Text style={styles.footer}>app.whatspay.africa</Text>
            </View>
          </ViewShot>

          <TouchableOpacity style={styles.shareBtn} onPress={share} disabled={sharing}>
            {sharing ? <ActivityIndicator color="#fff" /> : <><Icon name="share-social" size={18} color="#fff" /><Text style={styles.shareText}>Partager mon badge</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>Fermer</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24},
  grabber: {width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16},
  badge: {borderRadius: 20, overflow: 'hidden'},
  badgeInner: {backgroundColor: GREEN, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24},
  logo: {width: 150, height: 46, marginBottom: 16, tintColor: '#fff'},
  avatar: {width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10},
  avatarText: {color: '#fff', fontSize: 28, fontWeight: font.weight.bold},
  name: {color: '#fff', fontSize: font.size.xl, fontWeight: font.weight.bold},
  tagline: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 4, marginBottom: 20},
  stats: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, gap: 20},
  stat: {alignItems: 'center', minWidth: 90},
  statVal: {color: '#fff', fontSize: font.size.xxl, fontWeight: font.weight.bold},
  statLabel: {color: '#dcfce7', fontSize: 10, marginTop: 2},
  statDivider: {width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)'},
  ambBox: {marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center'},
  ambLabel: {color: '#dcfce7', fontSize: 9, fontWeight: font.weight.bold, letterSpacing: 1},
  ambCode: {color: '#fff', fontSize: font.size.lg, fontWeight: font.weight.bold, letterSpacing: 2, marginTop: 2},
  footer: {color: '#bbf7d0', fontSize: font.size.xs, marginTop: 20, fontWeight: font.weight.medium},
  shareBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, marginTop: 20},
  shareText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  closeBtn: {alignItems: 'center', paddingVertical: 12, marginTop: 4},
  closeText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
});
