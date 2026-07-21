import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {DashboardData, fetchDashboard} from '../api/dashboard';
import {apiErrorMessage} from '../api/client';
import {money, statusMeta} from '../lib/status';
import {WHATSAPP_CHANNEL_URL} from '../config';
import {markChannelJoined, markChannelShown} from '../api/kyc';
import NudgeBanners from '../components/NudgeBanners';
import NudgeModalView from '../components/NudgeModalView';
import KycBanner from '../components/KycBanner';
import OnboardingModal from '../components/OnboardingModal';
import ProfileReviewBanner from '../components/ProfileReviewBanner';
import Icon from '../components/Icon';
import {acknowledgeIncident, fetchNudges, Nudge, NudgeCta} from '../api/nudges';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const C = {blue: '#3b82f6', green: '#16a34a', orange: '#f59e0b', red: '#ef4444', teal: '#14b8a6', yellow: '#eab308'};

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR');
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

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faqIndex, setFaqIndex] = useState(0);

  const [banners, setBanners] = useState<Nudge[]>([]);
  const [modal, setModal] = useState<Nudge | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [waHidden, setWaHidden] = useState(false);

  const onCta = useCallback(
    (cta: NudgeCta) => {
      switch (cta.screen) {
        case 'missions': navigation.navigate('Tabs', {screen: 'Campagnes'}); break;
        case 'wallet': navigation.navigate('Tabs', {screen: 'Gains'}); break;
        case 'mission_detail': if (cta.params?.id) navigation.navigate('MissionDetail', {id: String(cta.params.id)}); break;
        case 'ambassador': navigation.navigate('Ambassador'); break;
        case 'faq': navigation.navigate('Faq'); break;
        case 'complaints': navigation.navigate('Complaints'); break;
      }
    },
    [navigation],
  );

  const closeModal = useCallback(() => {
    const m = modal;
    setModal(null);
    if (m && m.id?.toLowerCase().includes('incident')) acknowledgeIncident().catch(() => {});
  }, [modal]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [d, n] = await Promise.all([
        fetchDashboard(),
        fetchNudges().catch(() => ({modal: null, banners: [] as Nudge[]})),
      ]);
      setData(d);
      setBanners(n.banners);
      setModal(n.modal);
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

  const showWa = !!data?.show_whatsapp_channel_modal && !waHidden;
  useEffect(() => {
    if (showWa) markChannelShown().catch(() => {});
  }, [showWa]);

  const joinChannel = () => {
    markChannelJoined().catch(() => {});
    Linking.openURL(WHATSAPP_CHANNEL_URL);
    setWaHidden(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const stats: any = data?.stats ?? {};
  const faqs: any[] = data?.faqs ?? [];
  const recent: any[] = data?.recent_assignments ?? [];
  const total = Number(stats.total ?? 0);
  const completion = stats.completion != null ? Number(stats.completion).toFixed(1) : null;
  const pie = [
    {name: 'En cours', value: Number(stats.in_progress ?? 0), color: C.blue},
    {name: 'Complétées', value: Number(stats.completed ?? 0), color: C.green},
    {name: 'Expirées', value: Number(stats.expired ?? 0), color: C.orange},
    {name: 'Rejetées', value: Number(stats.rejected ?? 0), color: C.red},
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{paddingBottom: spacing.xxl}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor={colors.primary} />}>

        {/* Bannières globales */}
        <View style={{paddingHorizontal: spacing.md, paddingTop: spacing.sm}}>
          <ProfileReviewBanner />
          <KycBanner />
          <NudgeBanners banners={banners.filter(b => !dismissed.includes(b.id))} onDismiss={id => setDismissed(p => [...p, id])} onCta={onCta} />
        </View>

        {!!error && <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}

        {/* Header vert */}
        <View style={styles.hero}>
          <Text style={styles.heroHello}>Bienvenue 🔥</Text>
          <Text style={styles.heroTitle}>Dashboard Diffuseur</Text>
          <Text style={styles.heroSub}>Suis tes campagnes, tes gains et tes performances.</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Taux de complétion</Text>
            <Text style={styles.progressVal}>{completion != null ? `${completion}%` : '—'}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${completion != null ? Number(completion) : 0}%`}]} />
          </View>
        </View>

        {/* Stats (chevauche le header) */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Vos statistiques</Text>
          <View style={styles.grid2}>
            <StatCard icon="sync-outline" value={stats.in_progress ?? 0} label="EN COURS" color={C.blue} />
            <StatCard icon="checkmark-circle-outline" value={stats.completed ?? 0} label="COMPLÉTÉES" color={C.green} />
            <StatCard icon="time-outline" value={stats.expired ?? 0} label="EXPIRÉES" color={C.orange} />
            <StatCard icon="close-circle-outline" value={stats.rejected ?? 0} label="REJETÉES" color={C.red} />
            <StatCard icon="stats-chart-outline" value={completion != null ? `${completion}%` : '—'} label="COMPLÉTION" color={C.green} />
          </View>
        </View>

        {/* Canal WhatsApp */}
        {showWa && (
          <TouchableOpacity style={styles.waCard} onPress={joinChannel} activeOpacity={0.9}>
            <View style={styles.waIcon}><Icon name="logo-whatsapp" size={20} color="#fff" /></View>
            <View style={{flex: 1}}>
              <Text style={styles.waTitle}>Chaîne WhatsApp officielle</Text>
              <Text style={styles.waSub}>Actualités, campagnes et annonces en temps réel</Text>
            </View>
            <View style={styles.waJoin}><Text style={styles.waJoinText}>Rejoindre</Text></View>
          </TouchableOpacity>
        )}

        {/* Actions Rapides */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions Rapides</Text>
          <View style={styles.grid2}>
            <ActionBtn label="CAMPAGNES" icon="megaphone-outline" bg={C.green} onPress={() => navigation.navigate('Tabs', {screen: 'Campagnes'})} />
            <ActionBtn label="GAINS" icon="card-outline" bg={C.teal} onPress={() => navigation.navigate('Tabs', {screen: 'Gains'})} />
            <ActionBtn label="TICKETS" icon="ticket-outline" bg={C.blue} onPress={() => navigation.navigate('Tickets')} />
            <ActionBtn label="PARRAINAGE" icon="share-social-outline" bg={C.yellow} onPress={() => navigation.navigate('Ambassador')} />
          </View>
        </View>

        {/* Tutoriel vidéo */}
        <TouchableOpacity
          style={styles.tutoCard}
          activeOpacity={0.9}
          onPress={() => Linking.openURL('https://youtube.com/shorts/NWTxbAtdOPg?feature=share')}>
          <View style={styles.tutoThumb}>
            <View style={styles.playBtn}><Icon name="play" size={24} color="#fff" style={{marginLeft: 3}} /></View>
            <Text style={styles.tutoThumbText}>Tutoriel : Participer à une campagne sur WhatsPAY</Text>
          </View>
          <View style={styles.tutoBody}>
            <View style={styles.tutoBadge}><Text style={styles.tutoBadgeText}>Tutoriel</Text></View>
            <Text style={styles.tutoTitle}>Comment utiliser WhatsPAY ?</Text>
            <Text style={styles.tutoDesc}>Regardez ce guide complet pour apprendre à accepter des campagnes, publier sur WhatsApp et soumettre vos preuves correctement.</Text>
            <View style={styles.tutoCta}><Text style={styles.tutoCtaText}>Ouvrir sur YouTube ↗</Text></View>
          </View>
        </TouchableOpacity>

        {/* FAQ carrousel */}
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
              <TouchableOpacity onPress={() => navigation.navigate('Faq')}><Text style={styles.linkGreen}>Voir la FAQ complète</Text></TouchableOpacity>
              <Text style={styles.muted}>{faqIndex + 1} / {faqs.length}</Text>
            </View>
          </View>
        )}

        {/* Le saviez-vous */}
        <View style={styles.tipCard}>
          <Icon name="bulb-outline" size={18} color={C.green} />
          <View style={{flex: 1}}>
            <Text style={styles.tipTitle}>LE SAVIEZ-VOUS ?</Text>
            <Text style={styles.tipText}>Chaque campagne a une date limite — ne soumettez pas au dernier moment pour éviter les incidents de réseau.</Text>
          </View>
        </View>

        {/* Missions récentes */}
        {recent.length > 0 && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Missions Récentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Tabs', {screen: 'Campagnes'})}><Text style={styles.linkGreen}>Voir tout ›</Text></TouchableOpacity>
            </View>
            {recent.map((a: any) => {
              const meta = statusMeta(a.status);
              return (
                <View key={a.id} style={styles.recentRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.recentName} numberOfLines={1}>{a.task_name ?? a.task?.name ?? '—'}</Text>
                    <Text style={styles.recentMeta}>{a.task?.type ?? 'image_link'} · {fmtDate(a.created_at)}</Text>
                  </View>
                  <View style={[styles.pill, {backgroundColor: meta.bg}]}><Text style={[styles.pillText, {color: meta.color}]}>{meta.label}</Text></View>
                  <Text style={styles.recentGain}>{Math.round(Number(a.gain ?? 0))} F</Text>
                  <TouchableOpacity style={styles.recentGo} onPress={() => navigation.navigate('MissionDetail', {id: a.id})}>
                    <Icon name="eye-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Répartition des missions (légende) */}
        {total > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Répartition Des Missions</Text>
            <View style={styles.donutWrap}>
              <View style={styles.donut}>
                <Text style={styles.donutTotal}>{total}</Text>
                <Text style={styles.donutLabel}>missions</Text>
              </View>
            </View>
            <View style={styles.grid2}>
              {pie.map(d => (
                <View key={d.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: d.color}]} />
                  <Text style={styles.legendText}>{d.name} ({d.value})</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <NudgeModalView nudge={modal} onClose={closeModal} onCta={onCta} />
      <OnboardingModal />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  errBox: {marginHorizontal: spacing.md, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm},
  errText: {color: colors.danger, fontSize: font.size.sm},

  hero: {backgroundColor: C.green, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  heroHello: {color: '#dcfce7', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold, marginTop: 2},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 4},
  progressRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 6},
  progressLabel: {color: '#dcfce7', fontSize: font.size.xs},
  progressVal: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  progressTrack: {height: 8, backgroundColor: '#22c55e', borderRadius: 4},
  progressFill: {height: 8, backgroundColor: '#fff', borderRadius: 4},

  statsCard: {marginHorizontal: 16, marginTop: -40, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  card: {marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  cardTitle: {color: '#374151', fontWeight: font.weight.bold, fontSize: font.size.sm, marginBottom: 12},
  grid2: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  statCard: {width: '47%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', gap: 2},
  statIcon: {fontSize: 18},
  statValue: {fontSize: font.size.lg, fontWeight: font.weight.bold},
  statLabel: {fontSize: 10, color: '#6b7280', fontWeight: font.weight.medium},

  waCard: {marginHorizontal: 16, marginTop: 16, backgroundColor: C.green, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12},
  waIcon: {width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  waTitle: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.sm},
  waSub: {color: '#dcfce7', fontSize: font.size.xs, marginTop: 1},
  waJoin: {backgroundColor: '#fff', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6},
  waJoinText: {color: '#128c7e', fontSize: font.size.xs, fontWeight: font.weight.bold},

  action: {width: '47%', minHeight: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12},
  actionIcon: {fontSize: 26},
  actionLabel: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},

  tutoCard: {marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  tutoThumb: {backgroundColor: '#111827', height: 144, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16},
  playBtn: {width: 56, height: 56, borderRadius: 28, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center'},
  playIcon: {color: '#fff', fontSize: 22, marginLeft: 3},
  tutoThumbText: {color: '#fff', fontSize: font.size.xs, marginTop: 12, textAlign: 'center'},
  tutoBody: {padding: 14},
  tutoBadge: {alignSelf: 'flex-start', backgroundColor: C.red, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2},
  tutoBadgeText: {color: '#fff', fontSize: 10, fontWeight: font.weight.bold},
  tutoTitle: {color: '#1f2937', fontWeight: font.weight.bold, fontSize: font.size.sm, marginTop: 8},
  tutoDesc: {color: '#6b7280', fontSize: font.size.xs, marginTop: 4, lineHeight: 17},
  tutoCta: {alignSelf: 'flex-start', backgroundColor: C.red, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12},
  tutoCtaText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},

  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  faqNav: {flexDirection: 'row', gap: 8},
  faqArrow: {width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'},
  faqArrowText: {color: '#6b7280', fontSize: font.size.md},
  faqRow: {flexDirection: 'row', gap: 8, marginBottom: 8},
  qBadge: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  qBadgeText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  faqQ: {flex: 1, color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.medium, lineHeight: 19},
  faqR: {flex: 1, color: '#6b7280', fontSize: font.size.xs, lineHeight: 17},
  linkGreen: {color: C.green, fontSize: font.size.xs, fontWeight: font.weight.medium},
  muted: {color: '#9ca3af', fontSize: font.size.xs},

  tipCard: {marginHorizontal: 16, marginTop: 16, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 8},
  tipIcon: {fontSize: 18},
  tipTitle: {color: '#166534', fontSize: font.size.xs, fontWeight: font.weight.bold, letterSpacing: 0.5},
  tipText: {color: '#15803d', fontSize: font.size.xs, marginTop: 4, lineHeight: 17},

  recentRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f3f4f6'},
  recentName: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  recentMeta: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
  pill: {borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2},
  pillText: {fontSize: 10, fontWeight: font.weight.bold},
  recentGain: {color: '#374151', fontSize: font.size.xs, fontWeight: font.weight.bold},
  recentGo: {width: 32, height: 32, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center'},

  donutWrap: {alignItems: 'center', marginBottom: 12},
  donut: {width: 140, height: 140, borderRadius: 70, borderWidth: 18, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'},
  donutTotal: {fontSize: 24, fontWeight: font.weight.bold, color: '#1f2937'},
  donutLabel: {fontSize: font.size.xs, color: '#6b7280'},
  legendItem: {width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8},
  legendDot: {width: 12, height: 12, borderRadius: 6},
  legendText: {fontSize: font.size.xs, color: '#4b5563'},
});
