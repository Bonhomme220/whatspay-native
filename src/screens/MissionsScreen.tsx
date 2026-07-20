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
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {fetchMissions, Mission, MissionsResponse} from '../api/missions';
import {apiErrorMessage} from '../api/client';
import {money, statusMeta} from '../lib/status';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type TabKey = 'disponibles' | 'en_cours' | 'terminees';

const TABS: {key: TabKey; label: string}[] = [
  {key: 'disponibles', label: 'Disponibles'},
  {key: 'en_cours', label: 'En cours'},
  {key: 'terminees', label: 'Terminées'},
];

function MissionCard({mission, onPress}: {mission: Mission; onPress: () => void}) {
  const meta = statusMeta(mission.status);
  const gain = mission.gain || mission.expected_gain;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>
          {mission.task?.name ?? 'Campagne'}
        </Text>
        <View style={[styles.badge, {backgroundColor: meta.bg}]}>
          <Text style={[styles.badgeText, {color: meta.color}]}>{meta.label}</Text>
        </View>
      </View>
      {!!mission.task?.client_name && (
        <Text style={styles.cardClient}>{mission.task.client_name}</Text>
      )}
      <View style={styles.cardBottom}>
        <Text style={styles.cardGain}>{money(gain)}</Text>
        {mission.task?.is_civic ? <Text style={styles.civic}>Citoyenne</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MissionsScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<MissionsResponse | null>(null);
  const [tab, setTab] = useState<TabKey>('disponibles');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchMissions());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les missions.'));
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

  const list = data?.[tab] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Missions</Text>

      <View style={styles.segment}>
        {TABS.map(t => {
          const active = t.key === tab;
          const count = data?.[t.key]?.length ?? 0;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.segItem, active && styles.segItemActive]}
              onPress={() => setTab(t.key)}>
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {t.label}
                {count ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={m => m.id}
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
              <Text style={styles.emptyText}>
                {error ?? 'Aucune mission dans cette catégorie.'}
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <MissionCard
              mission={item}
              onPress={() => navigation.navigate('MissionDetail', {id: item.id})}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm},
  segment: {flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md},
  segItem: {flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center'},
  segItemActive: {backgroundColor: colors.primary},
  segText: {fontSize: font.size.xs, color: colors.textMuted, fontWeight: font.weight.medium},
  segTextActive: {color: colors.textOnPrimary, fontWeight: font.weight.bold},
  listContent: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
  card: {backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  cardName: {flex: 1, fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginRight: spacing.sm},
  cardClient: {fontSize: font.size.sm, color: colors.textMuted, marginTop: 2},
  cardBottom: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md},
  cardGain: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.primary},
  civic: {fontSize: font.size.xs, color: colors.warning, fontWeight: font.weight.bold},
  badge: {borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4},
  badgeText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', padding: spacing.xxl},
  emptyText: {color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center'},
});
