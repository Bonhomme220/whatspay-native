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
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {Complaint, fetchComplaints} from '../api/complaints';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Complaints'>;
const GREEN = '#16a34a';

const STATUS: Record<string, {label: string; bg: string; fg: string}> = {
  pending: {label: 'En cours', bg: '#fffbeb', fg: '#b45309'},
  accepted: {label: 'Acceptée', bg: '#dcfce7', fg: '#15803d'},
  resolved: {label: 'Résolue', bg: '#dcfce7', fg: '#15803d'},
  rejected: {label: 'Rejetée', bg: '#fee2e2', fg: '#b91c1c'},
};
function meta(s: string) {
  return STATUS[(s ?? '').toLowerCase()] ?? {label: s, bg: '#f3f4f6', fg: '#4b5563'};
}
function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

export default function ComplaintsScreen({navigation}: Props) {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchComplaints());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={16} color="#dcfce7" /><Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Mes Réclamations</Text>
        <Text style={styles.heroSub}>Suivez vos réclamations sur les missions</Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Icon name="flag-outline" size={30} color="#9ca3af" /></View>
              <Text style={styles.emptyText}>Aucune réclamation.</Text>
            </View>
          }
          renderItem={({item}) => {
            const m = meta(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.task} numberOfLines={1}>{item.task_name ?? 'Mission'}</Text>
                  <View style={[styles.pill, {backgroundColor: m.bg}]}><Text style={[styles.pillText, {color: m.fg}]}>{m.label}</Text></View>
                </View>
                <Text style={styles.date}>{fmtDate(item.created_at)}</Text>
                <Text style={styles.message}>{item.message}</Text>
                {!!item.admin_note && (
                  <View style={styles.note}><Text style={styles.noteText}>Réponse : {item.admin_note}</Text></View>
                )}
              </View>
            );
          }}
        />
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
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  task: {flex: 1, color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.bold},
  date: {color: '#9ca3af', fontSize: 10, marginTop: 2},
  message: {color: '#374151', fontSize: font.size.sm, marginTop: 8, lineHeight: 20},
  note: {backgroundColor: '#f9fafb', borderRadius: 10, padding: 10, marginTop: 10},
  noteText: {color: '#6b7280', fontSize: font.size.xs},
  pill: {borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3},
  pillText: {fontSize: 10, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  emptyText: {color: '#6b7280', fontSize: font.size.sm},
});
