import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, font, radius, spacing} from '../theme';
import {useAuth} from '../context/AuthContext';
import {DashboardData, fetchDashboard} from '../api/dashboard';
import {apiErrorMessage} from '../api/client';

function StatCard({label, value, tint}: {label: string; value: string; tint?: string}) {
  return (
    <View style={[styles.stat, tint ? {backgroundColor: tint} : null]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const {user, signOut} = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await fetchDashboard();
      setData(d);
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger le tableau de bord.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const stats = data?.stats ?? {};
  const earnings = data?.earnings ?? {};
  const balance =
    earnings.balance ?? earnings.available ?? earnings.total ?? stats.balance ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.hello}>Bonjour,</Text>
          <Text style={styles.name}>{user?.firstname ?? 'Diffuseur'} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Solde */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <Text style={styles.balanceValue}>{Number(balance).toLocaleString('fr-FR')} FCFA</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="En cours" value={String(stats.in_progress ?? 0)} tint={colors.primarySoft} />
            <StatCard label="Fiabilité" value={`${Math.round(Number(stats.completion ?? 0))}%`} />
          </View>

          {/* Missions récentes */}
          <Text style={styles.sectionTitle}>Missions récentes</Text>
          {(data?.recent_assignments ?? []).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune mission récente.</Text>
            </View>
          ) : (
            (data?.recent_assignments ?? []).slice(0, 8).map(a => (
              <View key={a.id} style={styles.assignRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.assignName} numberOfLines={1}>
                    {a.task?.name ?? 'Campagne'}
                  </Text>
                  <Text style={styles.assignStatus}>{a.status}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  hello: {fontSize: font.size.sm, color: colors.textMuted},
  name: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text},
  logoutBtn: {paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border},
  logoutText: {color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.medium},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  errorBox: {backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md},
  errorText: {color: colors.danger, fontSize: font.size.sm},
  balanceCard: {backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg},
  balanceLabel: {color: colors.primarySoft, fontSize: font.size.sm},
  balanceValue: {color: colors.textOnPrimary, fontSize: font.size.xxl, fontWeight: font.weight.bold, marginTop: spacing.xs},
  statsRow: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl},
  stat: {flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border},
  statValue: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text},
  statLabel: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs},
  sectionTitle: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md},
  emptyCard: {backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border},
  emptyText: {color: colors.textMuted, fontSize: font.size.sm},
  assignRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  assignName: {fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.text},
  assignStatus: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2},
});
