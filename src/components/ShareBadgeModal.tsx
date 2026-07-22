import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot, {captureRef} from 'react-native-view-shot';
import Share from 'react-native-share';
import Icon from './Icon';
import {font} from '../theme';

export interface BadgeProps {
  visible: boolean;
  onClose: () => void;
  firstname?: string;
  lastInitial?: string;
  year?: string;
  totalViews?: number;
  completedCampaigns?: number;
  reliability?: number | null;
  isAmbassador?: boolean;
  code?: string | null;
  activeReferrals?: number;
  civicCount?: number;
}

// Format PWA : 1080×1350. On rend à W pt et on scale toutes les valeurs.
const W = Math.min(Dimensions.get('window').width - 40, 360);
const S = W / 1080;
const s = (n: number) => Math.round(n * S * 100) / 100;
const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');

export default function ShareBadgeModal(props: BadgeProps) {
  const {visible, onClose} = props;
  const shotRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const gold = !!props.isAmbassador;
  const accent = gold ? '#E0A227' : '#1BA24B';
  const bg = '#F4F1EA';
  const dark = '#161616';
  const initials = `${props.firstname?.[0] ?? ''}${props.lastInitial ?? ''}`.toUpperCase() || '?';
  const reliability = typeof props.reliability === 'number' ? Math.round(props.reliability) : null;

  const stats = [
    {value: props.year || '—', label: 'MEMBRE'},
    {value: fmt(props.totalViews ?? 0), label: 'VUES'},
    {value: fmt(props.completedCampaigns ?? 0), label: 'CAMPAGNES'},
    {value: reliability !== null ? `${reliability}%` : '—', label: 'FIABILITÉ'},
  ];

  const share = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(shotRef, {format: 'png', quality: 1, result: 'tmpfile'});
      await Share.open({
        url: uri.startsWith('file://') ? uri : 'file://' + uri,
        type: 'image/png',
        message: `Je monétise mes Status WhatsApp avec WhatsPAY 🚀${props.code ? `\nCode ambassadeur : ${props.code}` : ''}\napp.whatspay.africa`,
        failOnCancel: false,
      });
    } catch {
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <ScrollView contentContainerStyle={{alignItems: 'center'}}>
            {/* ── Carte badge (capturée) ── */}
            <ViewShot ref={shotRef as any}>
              <View style={{width: W, height: s(1350), backgroundColor: bg, overflow: 'hidden', paddingTop: s(80), paddingHorizontal: s(78), paddingBottom: s(72)}}>
                {/* Barre d'accent */}
                <View style={{position: 'absolute', top: 0, left: 0, right: 0, height: s(18), backgroundColor: accent}} />

                {/* Header : logo + pill rôle */}
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Image source={require('../assets/logo.png')} style={{height: s(88), width: s(300)}} resizeMode="contain" />
                  <View style={{borderWidth: s(2), borderColor: accent, borderRadius: 999, paddingVertical: s(12), paddingHorizontal: s(28)}}>
                    <Text style={{color: accent, fontSize: s(28), fontWeight: '800', letterSpacing: s(3)}}>{gold ? '★ AMBASSADEUR' : '◆ DIFFUSEUR'}</Text>
                  </View>
                </View>

                {/* Avatar */}
                <View style={{alignSelf: 'center', marginTop: s(56)}}>
                  <View style={{width: s(340), height: s(340), borderRadius: s(170), backgroundColor: '#fff', borderWidth: s(5), borderColor: accent, alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{fontSize: s(150), fontWeight: '800', color: accent}}>{initials}</Text>
                  </View>
                </View>

                {/* Nom */}
                <Text style={{textAlign: 'center', marginTop: s(34), fontSize: s(74), fontWeight: '800', color: dark}}>
                  {props.firstname} {props.lastInitial}.
                </Text>

                {/* Bandeau stats */}
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s(40), backgroundColor: '#fff', borderRadius: s(26), paddingVertical: s(30), paddingHorizontal: s(10)}}>
                  {stats.map((st, i) => (
                    <View key={st.label} style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                      <View style={{flex: 1, alignItems: 'center'}}>
                        <Text style={{fontSize: s(50), fontWeight: '800', color: dark}}>{st.value}</Text>
                        <Text style={{fontSize: s(19), fontWeight: '700', letterSpacing: s(1.5), color: '#9a958c', marginTop: s(9)}}>{st.label}</Text>
                      </View>
                      {i < stats.length - 1 && <View style={{width: 1, height: s(74), backgroundColor: '#e6e2d8'}} />}
                    </View>
                  ))}
                </View>

                {/* Bloc ambassadeur */}
                {gold && !!props.code && (
                  <View style={{marginTop: s(40), marginHorizontal: s(18)}}>
                    <View style={{backgroundColor: dark, borderRadius: s(24), paddingVertical: s(28), paddingHorizontal: s(30), alignItems: 'center'}}>
                      <Text style={{fontSize: s(22), fontWeight: '800', letterSpacing: s(3), color: accent}}>MON CODE AMBASSADEUR</Text>
                      <Text style={{fontSize: s(62), fontWeight: '800', color: '#fff', marginTop: s(10), letterSpacing: s(2)}}>{props.code}</Text>
                    </View>
                    {typeof props.activeReferrals === 'number' && props.activeReferrals > 0 && (
                      <Text style={{textAlign: 'center', marginTop: s(18), fontSize: s(28), fontWeight: '700', color: '#5a5a5a'}}>
                        {props.activeReferrals} filleul{props.activeReferrals > 1 ? 's' : ''} actif{props.activeReferrals > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                )}

                {/* Badge citoyen */}
                {(props.civicCount ?? 0) > 0 && !gold && (
                  <Text style={{marginTop: s(40), textAlign: 'center', fontSize: s(30), fontWeight: '700', color: '#1BA24B'}}>
                    🏛️ A soutenu {props.civicCount} campagne{(props.civicCount ?? 0) > 1 ? 's' : ''} citoyenne{(props.civicCount ?? 0) > 1 ? 's' : ''}
                  </Text>
                )}

                {/* Spacer */}
                <View style={{flex: 1}} />

                {/* Footer */}
                <View style={{alignItems: 'center'}}>
                  <Text style={{fontSize: s(24), fontWeight: '800', letterSpacing: s(3), color: accent, marginBottom: s(16)}}>◆ APP.WHATSPAY.AFRICA</Text>
                  <Text style={{textAlign: 'center', fontSize: s(52), fontWeight: '800', color: dark, lineHeight: s(60)}}>
                    {gold ? <>Mon réseau. <Text style={{color: accent}}>Mes gains.</Text></> : <>Je fais partie du <Text style={{color: accent}}>mouvement.</Text></>}
                  </Text>
                </View>
              </View>
            </ViewShot>
          </ScrollView>

          <TouchableOpacity style={[styles.shareBtn, {backgroundColor: accent}]} onPress={share} disabled={sharing}>
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
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, maxHeight: '92%'},
  grabber: {width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16},
  shareBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15, marginTop: 16},
  shareText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  closeBtn: {alignItems: 'center', paddingVertical: 12, marginTop: 4},
  closeText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
});
