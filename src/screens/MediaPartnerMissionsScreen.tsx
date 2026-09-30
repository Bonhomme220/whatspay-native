import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {
  acceptMediaPartnerMission,
  fetchMediaPartnerMissions,
  MediaPartnerMission,
  MediaPartnerMissionsResponse,
} from '../api/mediaPartnerMissions';
import {apiErrorMessage} from '../api/client';
import {useAuth} from '../context/AuthContext';
import Icon from '../components/Icon';
import {font, spacing} from '../theme';

type Nav = NativeStackNavigationProp<MediaPartnerStackParamList>;
type TabKey = 'disponibles' | 'en_cours' | 'terminees';

const GREEN = '#1ba24b';

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Disponible',
  PENDING: 'En cours',
  SUBMITED: 'Soumise',
  SUBMISSION_ACCEPTED: 'Terminée',
  SUBMISSION_REJECTED: 'Rejetée',
  EXPIRED: 'Expirée',
};
const STATUS_COLOR: Record<string, {bg: string; fg: string; dot: string}> = {
  SUBMITED: {bg: '#ffedd5', fg: '#ea580c', dot: '#f97316'},
  PENDING: {bg: '#dbeafe', fg: '#2563eb', dot: '#3b82f6'},
  SUBMISSION_ACCEPTED: {bg: '#dcfce7', fg: '#15803d', dot: '#22c55e'},
  SUBMISSION_REJECTED: {bg: '#fee2e2', fg: '#dc2626', dot: '#ef4444'},
  EXPIRED: {bg: '#fee2e2', fg: '#dc2626', dot: '#ef4444'},
};
function statusStyle(s: string) {
  return STATUS_COLOR[s] ?? {bg: '#f3f4f6', fg: '#4b5563', dot: '#9ca3af'};
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

const TABS: {key: TabKey; label: string; icon: string}[] = [
  {key: 'disponibles', label: 'Disponibles', icon: 'star-outline'},
  {key: 'en_cours', label: 'En cours', icon: 'time-outline'},
  {key: 'terminees', label: 'Terminées', icon: 'checkmark-circle-outline'},
];

function StatusPill({status}: {status: string}) {
  const s = statusStyle(status);
  return (
    <View style={[styles.pill, {backgroundColor: s.bg}]}>
      <View style={[styles.dot, {backgroundColor: s.dot}]} />
      <Text style={[styles.pillText, {color: s.fg}]}>{STATUS_LABEL[status] ?? status}</Text>
    </View>
  );
}

function CampaignTypeBadge({type}: {type?: string}) {
  if (!type) return null;
  const isConversion = type === 'conversion';
  return (
    <View style={[styles.typeBadge, isConversion ? styles.typeBadgeConversion : styles.typeBadgeNotoriete]}>
      <Text style={styles.typeBadgeText}>{isConversion ? '🎯 Conversion' : '📢 Notoriété'}</Text>
    </View>
  );
}

function MediaThumb({m}: {m: MediaPartnerMission}) {
  const t = m.task;
  const isImage = t.media_type === 'image' && !!t.files;
  if (isImage) {
    return <Image source={{uri: t.files!}} style={styles.thumb} resizeMode="cover" />;
  }
  const icon = t.media_type === 'video' ? 'play-circle-outline' : t.media_type === 'pdf' ? 'document-outline' : 'text-outline';
  return (
    <View style={[styles.thumb, styles.thumbPlaceholder]}>
      <Icon name={icon} size={22} color="#9ca3af" />
    </View>
  );
}

function Empty({text}: {text: string}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Icon name="clipboard-outline" size={30} color="#9ca3af" /></View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export default function MediaPartnerMissionsScreen() {
  const navigation = useNavigation<Nav>();
  const {signOut} = useAuth();
  const [data, setData] = useState<MediaPartnerMissionsResponse | null>(null);
  const [tab, setTab] = useState<TabKey>('disponibles');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchMediaPartnerMissions());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les missions.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async (id: string) => {
    setAccepting(id);
    try {
      await acceptMediaPartnerMission(id);
      navigation.navigate('MediaPartnerMissionDetail', {id});
    } catch (e) {
      Alert.alert('Oups', apiErrorMessage(e, "Impossible d'accepter la mission. Elle a peut-être déjà expiré."));
      load();
    } finally {
      setAccepting(null);
    }
  };

  const counts = {
    disponibles: data?.disponibles.length ?? 0,
    en_cours: data?.en_cours.length ?? 0,
    terminees: data?.terminees.length ?? 0,
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{paddingBottom: spacing.xxl}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor={GREEN} />}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Mes Missions</Text>
              <Text style={styles.heroSub}>Chaîne partenaire WhatsPAY</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.cumulCard}>
            <View>
              <Text style={styles.cumulLabel}>Gains cumulés</Text>
              <Text style={styles.cumulValue}>+{Math.round(data?.gains_cumules ?? 0).toLocaleString('fr-FR')} F</Text>
            </View>
            <View style={styles.cumulIcon}><Icon name="cash-outline" size={20} color={GREEN} /></View>
          </View>

          <View style={styles.chips}>
            {TABS.map(t => (
              <TouchableOpacity key={t.key} style={styles.chip} onPress={() => setTab(t.key)} activeOpacity={0.8}>
                <Text style={styles.chipNum}>{counts[t.key]}</Text>
                <Text style={styles.chipLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab bar overlapping */}
        <View style={styles.tabBar}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <TouchableOpacity key={t.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t.key)} activeOpacity={0.8}>
                <Icon name={t.icon} size={16} color={active ? '#fff' : '#9ca3af'} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <View style={{paddingHorizontal: 16, paddingTop: 16}}>
          {loading ? (
            <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>
          ) : error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Icon name="cloud-offline-outline" size={30} color="#9ca3af" /></View>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => {setLoading(true); load();}}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : !data ? null : tab === 'disponibles' ? (
            data.disponibles.length === 0 ? (
              <Empty text="Aucune mission disponible pour le moment." />
            ) : (
              <>
                <View style={styles.infoBox}>
                  <Icon name="information-circle-outline" size={16} color="#3b82f6" />
                  <Text style={styles.infoText}>Acceptez une mission puis publiez le contenu sur votre chaîne WhatsApp.</Text>
                </View>
                {data.disponibles.map(m => (
                  <DispoCard key={m.id} m={m} onAccept={accept} accepting={accepting} onOpen={() => navigation.navigate('MediaPartnerMissionDetail', {id: m.id})} />
                ))}
              </>
            )
          ) : tab === 'en_cours' ? (
            data.en_cours.length === 0 ? (
              <Empty text="Aucune mission en cours." />
            ) : (
              data.en_cours.map(m => <MissionCard key={m.id} m={m} onOpen={() => navigation.navigate('MediaPartnerMissionDetail', {id: m.id})} />)
            )
          ) : data.terminees.length === 0 ? (
            <Empty text="Aucune mission terminée." />
          ) : (
            data.terminees.map(m => <MissionCard key={m.id} m={m} onOpen={() => navigation.navigate('MediaPartnerMissionDetail', {id: m.id})} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DispoCard({
  m,
  onAccept,
  onOpen,
  accepting,
}: {
  m: MediaPartnerMission;
  onAccept: (id: string) => void;
  onOpen: () => void;
  accepting: string | null;
}) {
  const t = m.task;
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <MediaThumb m={m} />
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.cardName} numberOfLines={1}>{t.name}</Text>
          {!!t.client_name && <Text style={styles.cardClient} numberOfLines={1}>{t.client_name}</Text>}
          <CampaignTypeBadge type={t.campaign_type} />
        </View>
        <Text style={styles.cardGain}>{Math.round(m.expected_gain)} F</Text>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.metaText}>Jusqu'au {fmtDate(t.enddate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.participate}
          onPress={() => onAccept(m.id)}
          disabled={accepting === m.id}
          activeOpacity={0.85}>
          {accepting === m.id ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="checkmark-circle-outline" size={14} color="#fff" />}
          <Text style={styles.participateText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function MissionCard({m, onOpen}: {m: MediaPartnerMission; onOpen: () => void}) {
  const t = m.task;
  const isGain = m.status === 'SUBMISSION_ACCEPTED';
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <MediaThumb m={m} />
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.cardName} numberOfLines={1}>{t.name}</Text>
          {!!t.client_name && <Text style={styles.cardClient} numberOfLines={1}>{t.client_name}</Text>}
          <CampaignTypeBadge type={t.campaign_type} />
        </View>
        <StatusPill status={m.status} />
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <Icon name="cash-outline" size={14} color="#9ca3af" />
          <Text style={[styles.gainText, {color: isGain ? GREEN : '#6b7280'}]}>
            {isGain ? '+' : ''}{Math.round(m.gain || m.expected_gain)} F
          </Text>
        </View>
        <View style={styles.voir}>
          <Icon name="eye-outline" size={16} color={GREEN} />
          <Text style={styles.voirText}>Voir</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  heroTop: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 2},
  logoutBtn: {width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'},
  cumulCard: {backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  cumulLabel: {color: '#dcfce7', fontSize: font.size.xs},
  cumulValue: {color: '#fff', fontSize: font.size.xl, fontWeight: font.weight.bold, marginTop: 2},
  cumulIcon: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  chips: {flexDirection: 'row', gap: 12, marginTop: 16},
  chip: {flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)'},
  chipNum: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  chipLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  tabBar: {marginHorizontal: 16, marginTop: -24, backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  tab: {flex: 1, paddingVertical: 12, alignItems: 'center', gap: 2, flexDirection: 'row', justifyContent: 'center'},
  tabActive: {backgroundColor: GREEN},
  tabLabel: {fontSize: font.size.xs, color: '#6b7280', fontWeight: font.weight.bold},
  tabLabelActive: {color: '#fff'},
  loader: {paddingVertical: 60, alignItems: 'center'},
  infoBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12},
  infoText: {flex: 1, color: '#1d4ed8', fontSize: font.size.xs},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardRow: {flexDirection: 'row', alignItems: 'flex-start'},
  thumb: {width: 52, height: 52, borderRadius: 10, backgroundColor: '#f3f4f6'},
  thumbPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  cardName: {color: '#1f2937', fontWeight: font.weight.bold, fontSize: font.size.sm},
  cardClient: {color: '#6b7280', fontSize: font.size.xs, marginTop: 1},
  cardGain: {color: '#15803d', fontWeight: font.weight.bold, fontSize: font.size.sm, marginLeft: 8},
  typeBadge: {alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6},
  typeBadgeNotoriete: {backgroundColor: '#eff6ff'},
  typeBadgeConversion: {backgroundColor: '#fff7ed'},
  typeBadgeText: {fontSize: 10, fontWeight: font.weight.bold, color: '#374151'},
  cardBottom: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {color: '#6b7280', fontSize: font.size.xs},
  participate: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12},
  participateText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  pill: {flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4},
  dot: {width: 6, height: 6, borderRadius: 3},
  pillText: {fontSize: 10, fontWeight: font.weight.bold},
  gainText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  voir: {flexDirection: 'row', alignItems: 'center', gap: 4},
  voirText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  emptyText: {color: '#6b7280', fontSize: font.size.sm, textAlign: 'center'},
  retryBtn: {marginTop: 12, backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10},
  retryText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
