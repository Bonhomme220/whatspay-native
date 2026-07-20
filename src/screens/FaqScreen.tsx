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
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Faq, fetchFaq} from '../api/faq';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Faq'>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen({navigation}: Props) {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchFaq());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger la FAQ.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Questions fréquentes</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.length === 0 && (
            <Text style={styles.empty}>{error ?? 'Aucune question pour le moment.'}</Text>
          )}
          {items.map(f => {
            const isOpen = open === f.id;
            return (
              <TouchableOpacity key={f.id} style={styles.item} activeOpacity={0.9} onPress={() => toggle(f.id)}>
                <View style={styles.qRow}>
                  <Text style={styles.question}>{f.question}</Text>
                  <Text style={styles.chevron}>{isOpen ? '−' : '+'}</Text>
                </View>
                {isOpen && <Text style={styles.answer}>{f.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  item: {backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  qRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  question: {flex: 1, fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginRight: spacing.md},
  chevron: {fontSize: font.size.xl, color: colors.primary, fontWeight: font.weight.bold},
  answer: {fontSize: font.size.sm, color: colors.textMuted, lineHeight: 21, marginTop: spacing.md},
  empty: {color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center', padding: spacing.xxl},
});
