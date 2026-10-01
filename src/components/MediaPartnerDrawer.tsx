import React, {useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDrawer} from '../context/DrawerContext';
import {useAuth} from '../context/AuthContext';
import type {MediaPartnerStackParamList} from '../navigation/MediaPartnerNavigator';
import type {MediaPartnerTabParamList} from '../navigation/MediaPartnerTabs';
import Icon from './Icon';
import {colors, font, radius, spacing} from '../theme';

const WIDTH = Math.min(300, Dimensions.get('window').width * 0.78);

type Nav = NativeStackNavigationProp<MediaPartnerStackParamList>;

type Target =
  | {kind: 'tab'; tab: keyof MediaPartnerTabParamList}
  | {kind: 'screen'; screen: Exclude<keyof MediaPartnerStackParamList, 'MediaPartnerTabs'>};

const NAV: {label: string; icon: string; target: Target}[] = [
  {label: 'Tableau de bord', icon: 'home-outline', target: {kind: 'tab', tab: 'Accueil'}},
  {label: 'Missions', icon: 'megaphone-outline', target: {kind: 'tab', tab: 'Missions'}},
  {label: 'Mes Gains', icon: 'wallet-outline', target: {kind: 'tab', tab: 'Gains'}},
  {label: 'Mes Chiffres (recapture)', icon: 'bar-chart-outline', target: {kind: 'screen', screen: 'MediaPartnerRecapture'}},
  {label: 'FAQ', icon: 'help-circle-outline', target: {kind: 'screen', screen: 'MediaPartnerFaq'}},
  {label: 'Mes Tickets', icon: 'ticket-outline', target: {kind: 'screen', screen: 'MediaPartnerTickets'}},
  {label: 'Mon Profil', icon: 'person-outline', target: {kind: 'tab', tab: 'Profil'}},
];

/** Drawer latéral de l'espace Partenaire Média — miroir d'AppDrawer (diffuseur). */
export default function MediaPartnerDrawer() {
  const {open, closeDrawer} = useDrawer();
  const {user, signOut} = useAuth();
  const navigation = useNavigation<Nav>();
  const tx = useRef(new Animated.Value(-WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(tx, {toValue: 0, duration: 220, useNativeDriver: true}),
        Animated.timing(fade, {toValue: 1, duration: 220, useNativeDriver: true}),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(tx, {toValue: -WIDTH, duration: 200, useNativeDriver: true}),
        Animated.timing(fade, {toValue: 0, duration: 200, useNativeDriver: true}),
      ]).start(({finished}) => finished && setMounted(false));
    }
  }, [open, mounted, tx, fade]);

  if (!mounted) return null;

  const go = (target: Target) => {
    closeDrawer();
    setTimeout(() => {
      if (target.kind === 'tab') navigation.navigate('MediaPartnerTabs', {screen: target.tab});
      else navigation.navigate(target.screen as any);
    }, 180);
  };

  const confirmLogout = () => {
    closeDrawer();
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Déconnexion', style: 'destructive', onPress: () => signOut()},
    ]);
  };

  const name = user ? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() : '—';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, {opacity: fade}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      <Animated.View style={[styles.panel, {transform: [{translateX: tx}]}]}>
        <SafeAreaView style={{flex: 1}} edges={['top', 'bottom']}>
          <View style={styles.head}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity onPress={closeDrawer} style={styles.close} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Icon name="person" size={22} color="#6b7280" />
            </View>
            <View>
              <Text style={styles.userName}>{name}</Text>
              <Text style={styles.userProfil}>Partenaire Média</Text>
            </View>
          </View>

          <ScrollView style={{flex: 1}} contentContainerStyle={{paddingVertical: spacing.sm}}>
            {NAV.map(item => (
              <TouchableOpacity key={item.label} style={styles.item} onPress={() => go(item.target)} activeOpacity={0.7}>
                <Icon name={item.icon} size={20} color="#9ca3af" style={{width: 24, textAlign: 'center'}} />
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Icon name="chevron-forward" size={16} color="#d1d5db" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.item} onPress={confirmLogout} activeOpacity={0.7}>
              <Icon name="log-out-outline" size={20} color={colors.danger} style={{width: 24, textAlign: 'center'}} />
              <Text style={[styles.itemLabel, {color: colors.danger}]}>Déconnexion</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.version}>WhatsPAY v2.1 · © 2026</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {backgroundColor: 'rgba(0,0,0,0.4)'},
  panel: {position: 'absolute', top: 0, left: 0, bottom: 0, width: WIDTH, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: {width: 2, height: 0}, elevation: 16},
  head: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  logo: {width: 120, height: 34},
  close: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  closeText: {fontSize: 16, color: '#6b7280'},
  userCard: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  avatar: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'},
  userName: {color: '#1f2937', fontWeight: font.weight.bold, fontSize: font.size.sm},
  userProfil: {color: colors.primary, fontSize: font.size.xs, fontWeight: font.weight.bold},
  item: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, marginHorizontal: 8, borderRadius: radius.md},
  itemLabel: {flex: 1, color: '#4b5563', fontSize: font.size.sm, fontWeight: font.weight.medium},
  footer: {paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6'},
  version: {color: '#9ca3af', fontSize: font.size.xs, textAlign: 'center'},
});
