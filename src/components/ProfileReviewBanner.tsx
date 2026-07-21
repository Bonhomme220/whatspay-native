import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {fetchProfile} from '../api/profile';
import Icon from './Icon';
import {font} from '../theme';

type Nav = NativeStackNavigationProp<AppStackParamList>;

/** Bandeau orange affiché quand profile_needs_review = true. */
export default function ProfileReviewBanner() {
  const navigation = useNavigation<Nav>();
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetchProfile().then(p => setShow(!!(p as any).profile_needs_review)).catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <View style={styles.banner}>
      <Icon name="alert-circle" size={20} color="#fff" />
      <View style={{flex: 1}}>
        <Text style={styles.title}>Vérifiez vos informations</Text>
        <Text style={styles.sub}>Suite à une mise à jour, merci de confirmer votre profil pour continuer à recevoir des campagnes.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.btnText}>Vérifier mon profil ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {backgroundColor: '#f97316', borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 8},
  title: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  sub: {color: '#ffedd5', fontSize: font.size.xs, marginTop: 2, lineHeight: 16},
  btn: {alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8},
  btnText: {color: '#ea580c', fontSize: font.size.xs, fontWeight: font.weight.bold},
});
