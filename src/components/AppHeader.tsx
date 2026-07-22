import React, {useCallback, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {useDrawer} from '../context/DrawerContext';
import {fetchNotifications} from '../api/notifications';
import Icon from './Icon';
import {colors, font, spacing} from '../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

/** Header blanc commun : hamburger (drawer), logo centré, cloche notifications. */
export default function AppHeader() {
  const navigation = useNavigation<Nav>();
  const {openDrawer} = useDrawer();
  const insets = useSafeAreaInsets();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
        .then(r => setUnread(r.unread_count ?? 0))
        .catch(() => {});
    }, []),
  );

  return (
    <View style={[styles.header, {height: 56 + insets.top, paddingTop: insets.top}]}>
      <TouchableOpacity onPress={openDrawer} style={styles.iconBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="menu-outline" size={26} color="#4b5563" />
      </TouchableOpacity>

      <View style={styles.center}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        style={styles.iconBtn}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="notifications-outline" size={23} color="#4b5563" />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {height: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md},
  iconBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  burger: {width: 22, height: 16, justifyContent: 'space-between'},
  line: {height: 2, borderRadius: 2, backgroundColor: '#4b5563'},
  center: {flex: 1, alignItems: 'center'},
  logo: {width: 120, height: 32},
  bell: {fontSize: 20},
  badge: {position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3},
  badgeText: {color: '#fff', fontSize: 9, fontWeight: font.weight.bold},
});
