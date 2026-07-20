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
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function NotificationsScreen({navigation}: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchNotifications();
      setItems(res.notifications);
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les notifications.'));
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

  const onPressItem = async (n: AppNotification) => {
    if (!n.is_read) {
      setItems(prev => prev.map(x => (x.id === n.id ? {...x, is_read: true} : x)));
      try {
        await markNotificationRead(n.id);
      } catch {}
    }
  };

  const onReadAll = async () => {
    setItems(prev => prev.map(x => ({...x, is_read: true})));
    try {
      await markAllNotificationsRead();
    } catch {}
  };

  const hasUnread = items.some(n => !n.is_read);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
        {hasUnread && (
          <TouchableOpacity onPress={onReadAll}>
            <Text style={styles.readAll}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>Notifications</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => n.id}
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
              <Text style={styles.emptyText}>{error ?? 'Aucune notification.'}</Text>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.row, !item.is_read && styles.rowUnread]}
              onPress={() => onPressItem(item)}
              activeOpacity={0.85}>
              {!item.is_read && <View style={styles.dot} />}
              <View style={{flex: 1}}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {!!item.body && <Text style={styles.rowBody}>{item.body}</Text>}
                <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
              </View>
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
  readAll: {color: colors.textMuted, fontSize: font.size.sm, fontWeight: font.weight.medium},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
  listContent: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
  row: {flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  rowUnread: {backgroundColor: '#f0fdf4', borderColor: colors.primarySoft},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6, marginRight: spacing.sm},
  rowTitle: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text},
  rowBody: {fontSize: font.size.sm, color: colors.text, marginTop: 2, lineHeight: 20},
  rowTime: {fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.xs},
  empty: {alignItems: 'center', padding: spacing.xxl},
  emptyText: {color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center'},
});
