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
import {fetchTickets, TicketListItem} from '../api/tickets';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Tickets'>;

function statusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'open' || s === 'ouvert') return colors.primary;
  if (s === 'closed' || s === 'fermé' || s === 'resolved') return colors.textMuted;
  return colors.warning;
}

export default function TicketsScreen({navigation}: Props) {
  const [items, setItems] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchTickets());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les tickets.'));
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
        <TouchableOpacity onPress={() => navigation.navigate('NewTicket')}>
          <Text style={styles.new}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Support</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={t => t.id}
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
              <Text style={styles.emptyText}>{error ?? 'Aucun ticket. Ouvre-en un si tu as besoin d’aide.'}</Text>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('TicketDetail', {id: item.id})}
              activeOpacity={0.85}>
              <View style={styles.rowTop}>
                <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                <View style={[styles.badge, {backgroundColor: statusColor(item.status)}]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              {!!item.last_message?.message && (
                <Text style={styles.preview} numberOfLines={1}>
                  {item.last_message.is_admin ? 'Support : ' : ''}
                  {item.last_message.message}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  new: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
  listContent: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
  row: {backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  rowTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  subject: {flex: 1, fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginRight: spacing.sm},
  preview: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs},
  badge: {borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3},
  badgeText: {fontSize: font.size.xs, color: colors.textOnPrimary, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', padding: spacing.xxl},
  emptyText: {color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center'},
});
