import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {Faq, fetchFaq} from '../api/faq';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Faq'>;
const GREEN = '#16a34a';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen({navigation}: Props) {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchFaq());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(p => (p === id ? null : id));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={16} color="#dcfce7" /><Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>FAQ</Text>
        <Text style={styles.heroSub}>Questions fréquentes sur WhatsPAY</Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {items.length === 0 && <Text style={styles.empty}>Aucune question pour le moment.</Text>}
          {items.map(f => {
            const isOpen = open === f.id;
            return (
              <TouchableOpacity key={f.id} style={styles.item} activeOpacity={0.9} onPress={() => toggle(f.id)}>
                <View style={styles.qRow}>
                  <Text style={styles.question}>{f.question}</Text>
                  <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                </View>
                {isOpen && <Text style={styles.answer}>{f.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40},
  back: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12},
  backText: {color: '#dcfce7', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 2},
  body: {padding: 16, marginTop: -24},
  item: {backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  qRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  question: {flex: 1, color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.bold},
  answer: {color: '#6b7280', fontSize: font.size.sm, lineHeight: 21, marginTop: 12},
  empty: {color: '#9ca3af', fontSize: font.size.sm, textAlign: 'center', paddingVertical: 40},
});
