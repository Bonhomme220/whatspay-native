import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MediaPartnerStackParamList} from '../navigation/MediaPartnerNavigator';
import {fetchMediaPartnerDashboard, MediaPartnerDashboardData} from '../api/mediaPartnerDashboard';
import {apiErrorMessage} from '../api/client';
import {statusMeta} from '../lib/status';
import {RecaptureBanner} from './MediaPartnerMissionsScreen';
import KycBanner from '../components/KycBanner';
import Icon from '../components/Icon';
import {font, spacing} from '../theme';

type Nav = NativeStackNavigationProp<MediaPartnerStackParamList>;

const GREEN = '#1ba24b';
const C = {blue: '#3b82f6', green: GREEN, orange: '#f59e0b', teal: '#14b8a6'};

const STATUS_INFO: Record<string, {label: string; bg: string; fg: string}> = {
  actif: {label: 'Actif', bg: '#dcfce7', fg: '#15803d'},
  inactif: {label: 'Inactif', bg: '#ffedd5', fg: '#c2410c'},
  off: {label: 'Désactivé', bg: '#fee2e2', fg: '#b91c1c'},
};

function fmt(n?: number | null) {
  return Math.round(Number(n ?? 0)).toLocaleString('fr-FR');
}
function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
}

function StatCard({icon, value, label, color}: {icon: string; value: string | number; label: string; color: string}) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({label, icon, bg, onPress}: {label: string; icon: string; bg: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={[styles.action, {backgroundColor: bg}]} onPress={onPress} activeOpacity={0.85}>
      <Icon name={icon} size={26} color="#fff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function MediaPartnerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<MediaPartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faqIndex, setFaqIndex] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchMediaPartnerDashboard());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger le tableau de bord.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GREEN} size="large" />
      </View>
    );
  }

  const statusInfo = data ? (STATUS_INFO[data.status] ?? {label: data.status, bg: '#f3f4f6', fg: '#4b5563'}) : null;
  const missionsStats = data?.missions_stats ?? {total: 0, in_progress: 0, completed: 0};
  const faqs = data?.faqs ?? [];
  const recent = data?.recent_missions ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{paddingBottom: spacing.xxl}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor={GREEN} />}>

        {/* Bannières globales */}
        <View style={{paddingHorizontal: spacing.md, paddingTop: spacing.sm}}>
          <KycBanner />
        </View>

        {!!error && <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}

        {/* Header vert */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{flex: 1}}>
              <Text style={styles.heroHello}>Bienvenue 🔥</Text>
              <Text style={styles.heroTitle} numberOfLines={1}>{data?.channel_name ?? 'Ma chaîne'}</Text>
            </View>
            {!!statusInfo && (
              <View style={[styles.statusPill, {backgroundColor: statusInfo.bg}]}>
                <Text style={[styles.statusPillText, {color: statusInfo.fg}]}>{statusInfo.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroSub}>
            {data?.current_tier
              ? `Palier ${data.current_tier.label} — ${fmt(data.current_tier.flat_price)} F / mission`
              : 'Chaîne partenaire WhatsPAY'}
          </Text>
        </View>

        {/* Stats (chevauche le header) */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Vos statistiques</Text>
          <View style={styles.grid2}>
            <StatCard icon="wallet-outline" value={`${fmt(data?.balance)} F`} label="SOLDE" color={C.green} />
            <StatCard icon="sync-outline" value={missionsStats.in_progress} label="EN COURS" color={C.blue} />
            <StatCard icon="checkmark-circle-outline" value={missionsStats.completed} label="COMPLÉTÉES" color={C.teal} />
            <StatCard icon="people-outline" value={fmt(data?.reached_accounts_30d)} label="COMPTES TOUCHÉS (30J)" color={C.orange} />
          </View>
        </View>

        {/* Recapture */}
        {!!data?.recapture_needed && (
          <View style={{paddingHorizontal: 16, marginTop: 16}}>
            <RecaptureBanner
              profile={{status: data.status, recapture_window_open: data.recapture_window_open}}
              onPress={() => navigation.navigate('MediaPartnerRecapture')}
            />
          </View>
        )}

        {/* Actions Rapides */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions Rapides</Text>
          <View style={styles.grid2}>
            <ActionBtn label="MISSIONS" icon="megaphone-outline" bg={C.green} onPress={() => navigation.navigate('MediaPartnerTabs', {screen: 'Missions'})} />
            <ActionBtn label="GAINS" icon="card-outline" bg={C.teal} onPress={() => navigation.navigate('MediaPartnerTabs', {screen: 'Gains'})} />
            <ActionBtn label="RECAPTURE" icon="document-text-outline" bg={C.orange} onPress={() => navigation.navigate('MediaPartnerRecapture')} />
            <ActionBtn label="PROFIL" icon="person-outline" bg={C.blue} onPress={() => navigation.navigate('MediaPartnerTabs', {screen: 'Profil'})} />
          </View>
        </View>

        {/* Missions récentes */}
        {recent.length > 0 && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Missions Récentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MediaPartnerTabs', {screen: 'Missions'})}><Text style={styles.linkGreen}>Voir tout ›</Text></TouchableOpacity>
            </View>
            {recent.map(m => {
              const meta = statusMeta(m.status);
              return (
                <View key={m.id} style={styles.recentRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.recentName} numberOfLines={1}>{m.task_name ?? '—'}</Text>
                    <Text style={styles.recentMeta}>{fmtDate(m.assignment_date)}</Text>
                  </View>
                  <View style={[styles.pill, {backgroundColor: meta.bg}]}><Text style={[styles.pillText, {color: meta.color}]}>{meta.label}</Text></View>
                  <Text style={styles.recentGain}>{fmt(m.gain)} F</Text>
                  <TouchableOpacity style={styles.recentGo} onPress={() => navigation.navigate('MediaPartnerMissionDetail', {id: m.id})}>
                    <Icon name="eye-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* FAQ teaser */}
        {faqs.length > 0 && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Icon name="help-circle-outline" size={16} color={C.green} />
                <Text style={styles.cardTitle}>Questions fréquentes</Text>
              </View>
              <View style={styles.faqNav}>
                <TouchableOpacity style={styles.faqArrow} onPress={() => setFaqIndex(i => Math.max(0, i - 1))}><Icon name="chevron-back" size={14} color="#6b7280" /></TouchableOpacity>
                <TouchableOpacity style={styles.faqArrow} onPress={() => setFaqIndex(i => Math.min(faqs.length - 1, i + 1))}><Icon name="chevron-forward" size={14} color="#6b7280" /></TouchableOpacity>
              </View>
            </View>
            <View style={styles.faqRow}>
              <View style={[styles.qBadge, {backgroundColor: C.green}]}><Text style={styles.qBadgeText}>Q</Text></View>
              <Text style={styles.faqQ}>{faqs[faqIndex]?.question}</Text>
            </View>
            <View style={styles.faqRow}>
              <View style={[styles.qBadge, {backgroundColor: '#f3f4f6'}]}><Text style={[styles.qBadgeText, {color: '#4b5563'}]}>R</Text></View>
              <Text style={styles.faqR} numberOfLines={4}>{faqs[faqIndex]?.answer}</Text>
            </View>
            <View style={[styles.rowBetween, {marginTop: spacing.md}]}>
              <TouchableOpacity onPress={() => navigation.navigate('MediaPartnerFaq')}><Text style={styles.linkGreen}>Voir la FAQ complète</Text></TouchableOpacity>
              <Text style={styles.muted}>{faqIndex + 1} / {faqs.length}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  errBox: {marginHorizontal: spacing.md, backgroundColor: '#fef2f2', borderRadius: 12, padding: spacing.md, marginTop: spacing.sm},
  errText: {color: '#dc2626', fontSize: font.size.sm},

  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  heroTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  heroHello: {color: '#dcfce7', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold, marginTop: 2},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 6},
  statusPill: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4},
  statusPillText: {fontSize: font.size.xs, fontWeight: font.weight.bold},

  statsCard: {marginHorizontal: 16, marginTop: -40, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  card: {marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  cardTitle: {color: '#374151', fontWeight: font.weight.bold, fontSize: font.size.sm, marginBottom: 12},
  grid2: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  statCard: {width: '47%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', gap: 2},
  statValue: {fontSize: font.size.lg, fontWeight: font.weight.bold},
  statLabel: {fontSize: 10, color: '#6b7280', fontWeight: font.weight.medium, textAlign: 'center'},

  action: {width: '47%', minHeight: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12},
  actionLabel: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},

  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  faqNav: {flexDirection: 'row', gap: 8},
  faqArrow: {width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'},
  faqRow: {flexDirection: 'row', gap: 8, marginBottom: 8},
  qBadge: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  qBadgeText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  faqQ: {flex: 1, color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.medium, lineHeight: 19},
  faqR: {flex: 1, color: '#6b7280', fontSize: font.size.xs, lineHeight: 17},
  linkGreen: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.medium},
  muted: {color: '#9ca3af', fontSize: font.size.xs},

  recentRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f3f4f6'},
  recentName: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  recentMeta: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
  pill: {borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2},
  pillText: {fontSize: 10, fontWeight: font.weight.bold},
  recentGain: {color: '#374151', fontSize: font.size.xs, fontWeight: font.weight.bold},
  recentGo: {width: 32, height: 32, borderRadius: 16, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center'},
});
