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
import {Button} from '../components/ui';
import {fetchGains, GainsResponse, GainTransaction} from '../api/gains';
import {apiErrorMessage} from '../api/client';
import {money} from '../lib/status';

type Nav = NativeStackNavigationProp<AppStackParamList>;

function txMeta(t: GainTransaction) {
  const isDebit = t.type?.toLowerCase().includes('déb') || t.amount < 0 || t.description?.toLowerCase().includes('retrait');
  const status = (t.status ?? '').toUpperCase();
  let color = colors.textMuted;
  if (['COMPLETED', 'SUCCESS', 'PAID', 'SUBMISSION_ACCEPTED'].includes(status)) color = colors.primary;
  else if (['FAILED', 'REJECTED', 'CANCELLED'].includes(status)) color = colors.danger;
  else if (['PENDING'].includes(status)) color = colors.warning;
  return {isDebit, color};
}

function Row({t}: {t: GainTransaction}) {
  const {isDebit, color} = txMeta(t);
  return (
    <View style={styles.row}>
      <View style={{flex: 1}}>
        <Text style={styles.rowDesc} numberOfLines={1}>{t.description || (isDebit ? 'Retrait' : 'Gain')}</Text>
        <Text style={styles.rowDate}>
          {t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : ''}
          {t.status ? ` · ${t.status}` : ''}
        </Text>
        {!!t.rejection_reason && <Text style={styles.rowReason}>{t.rejection_reason}</Text>}
      </View>
      <Text style={[styles.rowAmount, {color: isDebit ? colors.danger : colors.primary}]}>
        {isDebit ? '-' : '+'}
        {money(Math.abs(t.amount)).replace(' FCFA', '')}
      </Text>
    </View>
  );
}

export default function GainsScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<GainsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchGains());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les gains.'));
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
      <Text style={styles.title}>Mes gains</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data?.transactions ?? []}
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
          ListHeaderComponent={
            <View>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Solde disponible</Text>
                <Text style={styles.balanceValue}>{money(data?.balance)}</Text>
                {!!data?.pending_withdrawal ? (
                  <Text style={styles.pending}>Retrait en attente : {money(data?.pending_withdrawal)}</Text>
                ) : null}
              </View>
              <Button
                title="Retirer mes gains"
                onPress={() => navigation.navigate('Withdraw', {balance: data?.balance ?? 0})}
                style={{marginBottom: spacing.lg}}
              />
              <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Ambassador')}>
                <Text style={styles.linkText}>🤝  Programme ambassadeur</Text>
                <Text style={styles.linkChevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.chips}>
                <Chip label="Ce mois" value={money(data?.this_month)} />
                <Chip label="Total gagné" value={money(data?.total_gain)} />
              </View>
              <View style={styles.chips}>
                <Chip label="Campagnes" value={String(data?.campagnes_terminees ?? 0)} />
                <Chip label="Vues" value={Number(data?.total_vues ?? 0).toLocaleString('fr-FR')} />
              </View>
              <Text style={styles.section}>Historique</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error ?? 'Aucune transaction pour le moment.'}</Text>
            </View>
          }
          renderItem={({item}) => <Row t={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function Chip({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm},
  listContent: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
  balanceCard: {backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.md},
  balanceLabel: {color: colors.primarySoft, fontSize: font.size.sm},
  balanceValue: {color: colors.textOnPrimary, fontSize: font.size.xxl, fontWeight: font.weight.bold, marginTop: 2},
  pending: {color: colors.primarySoft, fontSize: font.size.xs, marginTop: spacing.sm},
  linkRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border},
  linkText: {fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium},
  linkChevron: {fontSize: font.size.xl, color: colors.textMuted},
  chips: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md},
  chip: {flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border},
  chipValue: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text},
  chipLabel: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2},
  section: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm},
  row: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  rowDesc: {fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.text},
  rowDate: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2},
  rowReason: {fontSize: font.size.xs, color: colors.danger, marginTop: 2},
  rowAmount: {fontSize: font.size.md, fontWeight: font.weight.bold, marginLeft: spacing.sm},
  empty: {alignItems: 'center', padding: spacing.xxl},
  emptyText: {color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center'},
});
