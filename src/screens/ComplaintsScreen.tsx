import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Complaint, fetchComplaints} from '../api/complaints';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Complaints'>;

function statusMeta(status: string): {label: string; color: string; bg: string} {
  const s = status?.toLowerCase();
  if (s === 'resolved' || s === 'resolu' || s === 'résolu') return {label: 'Résolue', color: colors.primaryDark, bg: colors.primarySoft};
  if (s === 'rejected' || s === 'rejete') return {label: 'Rejetée', color: colors.danger, bg: colors.dangerSoft};
  return {label: 'En cours', color: colors.warning, bg: colors.warningSoft};
}

export default function ComplaintsScreen({navigation}: Props) {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchComplaints());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les réclamations.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Mes réclamations</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error ?? 'Aucune réclamation.'}</Text>
            </View>
          }
          renderItem={({item}) => {
            const meta = statusMeta(item.status);
            return (
              <View style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.task} numberOfLines={1}>{item.task_name ?? 'Mission'}</Text>
                  <View style={[styles.badge, {backgroundColor: meta.bg}]}>
                    <Text style={[styles.badgeText, {color: meta.color}]}>{meta.label}</Text>
                  </View>
                </View>
                <Text style={styles.message}>{item.message}</Text>
                {!!item.admin_note && (
                  <View style={styles.note}>
                    <Text style={styles.noteText}>Réponse : {item.admin_note}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
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
  listContent: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
  row: {backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  rowTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs},
  task: {flex: 1, fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginRight: spacing.sm},
  message: {fontSize: font.size.sm, color: colors.text, lineHeight: 20},
  note: {backgroundColor: colors.bg, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm},
  noteText: {fontSize: font.size.sm, color: colors.textMuted},
  badge: {borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3},
  badgeText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', padding: spacing.xxl},
  emptyText: {color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center'},
});
