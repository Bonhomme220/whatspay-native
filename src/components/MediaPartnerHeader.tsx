import React from 'react';
import {Alert, Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDrawer} from '../context/DrawerContext';
import {useAuth} from '../context/AuthContext';
import Icon from './Icon';
import {spacing} from '../theme';

/**
 * Header blanc de l'espace Partenaire Média — miroir d'AppHeader (diffuseur) : hamburger
 * (drawer) + logo centré, mais avec un bouton déconnexion direct au lieu de la cloche
 * notifications (pas d'écran liste de notifications dédié côté Partenaire Média pour
 * l'instant, et la déconnexion n'est sinon accessible que depuis l'onglet Profil).
 */
export default function MediaPartnerHeader() {
  const {openDrawer} = useDrawer();
  const {signOut} = useAuth();
  const insets = useSafeAreaInsets();

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Déconnexion', style: 'destructive', onPress: () => signOut()},
    ]);
  };

  return (
    <View style={[styles.header, {height: 56 + insets.top, paddingTop: insets.top}]}>
      <TouchableOpacity onPress={openDrawer} style={styles.iconBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="menu-outline" size={26} color="#4b5563" />
      </TouchableOpacity>

      <View style={styles.center}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <TouchableOpacity onPress={confirmLogout} style={styles.iconBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="log-out-outline" size={23} color="#4b5563" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {height: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md},
  iconBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  center: {flex: 1, alignItems: 'center'},
  logo: {width: 120, height: 32},
});
