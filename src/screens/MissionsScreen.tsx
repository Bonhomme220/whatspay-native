import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {acceptMission, fetchMissions, Mission, MissionsResponse} from '../api/missions';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import {DateField} from '../components/DateField';
import {font, spacing} from '../theme';

const PAGE_SIZE = 10;
type TermStatus = 'tous' | 'SUBMITED' | 'SUBMISSION_ACCEPTED' | 'SUBMISSION_REJECTED' | 'EXPIRED';
const TERM_STATUS_OPTIONS: {key: TermStatus; label: string}[] = [
  {key: 'tous', label: 'Tous'},
  {key: 'SUBMISSION_ACCEPTED', label: 'Terminée'},
  {key: 'SUBMITED', label: 'Soumise'},
  {key: 'SUBMISSION_REJECTED', label: 'Rejetée'},
  {key: 'EXPIRED', label: 'Expirée'},
];

type Nav = NativeStackNavigationProp<AppStackParamList>;
type TabKey = 'disponibles' | 'en_cours' | 'terminees';

const GREEN = '#16a34a';

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Disponible', PENDING: 'En cours', SUBMITED: 'Soumise',
  SUBMISSION_ACCEPTED: 'Terminée', SUBMISSION_REJECTED: 'Rejetée', EXPIRED: 'Expirée',
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
function daysLeft(enddate?: string) {
  if (!enddate) return 0;
  return Math.max(0, Math.ceil((new Date(enddate).getTime() - Date.now()) / 86400000));
}
function progressPct(start?: string, end?: string) {
  if (!start || !end) return 0;
  const total = new Date(end).getTime() - new Date(start).getTime();
  const elapsed = Date.now() - new Date(start).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
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

function Empty({text}: {text: string}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Icon name="clipboard-outline" size={30} color="#9ca3af" /></View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export default function MissionsScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<MissionsResponse | null>(null);
  const [tab, setTab] = useState<TabKey>('disponibles');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<Record<TabKey, number>>({disponibles: 1, en_cours: 1, terminees: 1});

  // Filtres de l'onglet "Terminées" uniquement (statut, période, recherche par nom de campagne).
  const [termStatus, setTermStatus] = useState<TermStatus>('tous');
  const [termFrom, setTermFrom] = useState<string | undefined>();
  const [termTo, setTermTo] = useState<string | undefined>();
  const [termSearch, setTermSearch] = useState('');

  const setTabPage = (p: number) => setPage(prev => ({...prev, [tab]: p}));

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchMissions());
    } catch (e) {
      setError(apiErrorMessage(e, 'Impossible de charger les campagnes.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async (id: string) => {
    setAccepting(id);
    try {
      await acceptMission(id);
      navigation.navigate('MissionDetail', {id});
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

  const filteredTerminees = useMemo(() => {
    const list = data?.terminees ?? [];
    const q = termSearch.trim().toLowerCase();
    const from = termFrom ? new Date(termFrom).getTime() : null;
    const to = termTo ? new Date(termTo).getTime() + 86_400_000 - 1 : null; // fin de journée incluse
    return list.filter(m => {
      if (termStatus !== 'tous' && m.status !== termStatus) return false;
      if (q && !(m.task?.name ?? '').toLowerCase().includes(q)) return false;
      if (from !== null || to !== null) {
        const d = m.submission_date ?? m.response_date ?? m.assignment_date;
        const t = d ? new Date(d).getTime() : null;
        if (t === null) return false;
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
      }
      return true;
    });
  }, [data?.terminees, termStatus, termFrom, termTo, termSearch]);

  const pageDisponibles = (data?.disponibles ?? []).slice((page.disponibles - 1) * PAGE_SIZE, page.disponibles * PAGE_SIZE);
  const pageEnCours = (data?.en_cours ?? []).slice((page.en_cours - 1) * PAGE_SIZE, page.en_cours * PAGE_SIZE);
  const pageTerminees = filteredTerminees.slice((page.terminees - 1) * PAGE_SIZE, page.terminees * PAGE_SIZE);

  const resetTermFilters = () => {
    setTermStatus('tous'); setTermFrom(undefined); setTermTo(undefined); setTermSearch('');
    setPage(prev => ({...prev, terminees: 1}));
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{paddingBottom: spacing.xxl}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor={GREEN} />}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Mes Missions</Text>
          <Text style={styles.heroSub}>Gérez vos campagnes publicitaires</Text>
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
                {active && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{counts[t.key]}</Text></View>}
                <Icon name={t.icon} size={16} color={active ? '#fff' : '#9ca3af'} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                {!active && <Text style={styles.tabCount}>{counts[t.key]}</Text>}
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
                  <Text style={styles.infoText}>Rejoignez une mission avant sa date limite pour gagner des FCFA.</Text>
                </View>
                {pageDisponibles.map(m => <DispoCard key={m.id} m={m} onAccept={accept} accepting={accepting} />)}
                <Pagination page={page.disponibles} totalItems={data.disponibles.length} onChange={setTabPage} />
              </>
            )
          ) : tab === 'en_cours' ? (
            data.en_cours.length === 0 ? (
              <Empty text="Aucune mission en cours." />
            ) : (
              <>
                {pageEnCours.map(m => <EnCoursCard key={m.id} m={m} onOpen={() => navigation.navigate('MissionDetail', {id: m.id})} />)}
                <Pagination page={page.en_cours} totalItems={data.en_cours.length} onChange={setTabPage} />
              </>
            )
          ) : (
            <>
              <View style={styles.cumulCard}>
                <View>
                  <Text style={styles.cumulLabel}>Gains cumulés</Text>
                  <Text style={styles.cumulValue}>+{Math.round(data.gains_cumules).toLocaleString('fr-FR')} F</Text>
                </View>
                <View style={styles.cumulIcon}><Icon name="cash-outline" size={20} color={GREEN} /></View>
              </View>

              {/* Filtres : statut, période, recherche */}
              <View style={styles.filterCard}>
                <View style={styles.filterChipsRow}>
                  {TERM_STATUS_OPTIONS.map(o => (
                    <TouchableOpacity
                      key={o.key}
                      style={[styles.filterChip, termStatus === o.key && styles.filterChipOn]}
                      onPress={() => {setTermStatus(o.key); setPage(p => ({...p, terminees: 1}));}}>
                      <Text style={[styles.filterChipText, termStatus === o.key && styles.filterChipTextOn]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.searchRow}>
                  <Icon name="search-outline" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.searchInput}
                    value={termSearch}
                    onChangeText={t => {setTermSearch(t); setPage(p => ({...p, terminees: 1}));}}
                    placeholder="Rechercher une campagne…"
                    placeholderTextColor="#9ca3af"
                  />
                  {!!termSearch && (
                    <TouchableOpacity onPress={() => {setTermSearch(''); setPage(p => ({...p, terminees: 1}));}}>
                      <Icon name="close-circle" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.dateRow}>
                  <View style={{flex: 1}}>
                    <DateField
                      value={termFrom}
                      onChange={d => {setTermFrom(d); setPage(p => ({...p, terminees: 1}));}}
                      placeholder="Du…"
                      maximumDate={new Date()}
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <DateField
                      value={termTo}
                      onChange={d => {setTermTo(d); setPage(p => ({...p, terminees: 1}));}}
                      placeholder="Au…"
                      maximumDate={new Date()}
                    />
                  </View>
                </View>
                {(termStatus !== 'tous' || !!termFrom || !!termTo || !!termSearch) && (
                  <TouchableOpacity onPress={resetTermFilters} style={styles.resetBtn}>
                    <Icon name="refresh-outline" size={14} color={GREEN} />
                    <Text style={styles.resetText}>Réinitialiser les filtres</Text>
                  </TouchableOpacity>
                )}
              </View>

              {filteredTerminees.length === 0 ? (
                <Empty text="Aucune mission terminée pour ces critères." />
              ) : (
                <>
                  <View style={styles.termList}>
                    {pageTerminees.map(m => <TermineeCard key={m.id} m={m} onOpen={() => navigation.navigate('MissionDetail', {id: m.id})} />)}
                  </View>
                  <Pagination page={page.terminees} totalItems={filteredTerminees.length} onChange={setTabPage} />
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DispoCard({m, onAccept, accepting}: {m: Mission; onAccept: (id: string) => void; accepting: string | null}) {
  const t = m.task;
  if (!t) return null;
  const pct = progressPct(t.startdate, t.enddate);
  const days = daysLeft(t.enddate);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>{t.name}</Text>
        <Text style={styles.cardGain}>{Math.round(m.expected_gain)} F</Text>
      </View>
      {!!t.category?.name && <Text style={styles.cat}>{t.category.name}</Text>}
      {!!t.description && <Text style={styles.desc} numberOfLines={2}>{t.description}</Text>}
      <View style={{marginTop: 12}}>
        <View style={styles.progRow}>
          <Text style={styles.progMuted}>Places restantes</Text>
          <Text style={styles.progMuted}>{t.slots_used ?? 0} utilisées</Text>
        </View>
        <View style={styles.progTrack}><View style={[styles.progFill, {width: `${pct}%`}]} /></View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.metaText}>Expire le {fmtDate(t.enddate)}{days > 0 ? ` · J-${days}` : ''}</Text>
        </View>
        <TouchableOpacity style={styles.participate} onPress={() => onAccept(m.id)} disabled={accepting === m.id} activeOpacity={0.85}>
          {accepting === m.id ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="person-add-outline" size={14} color="#fff" />}
          <Text style={styles.participateText}>Participer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EnCoursCard({m, onOpen}: {m: Mission; onOpen: () => void}) {
  const t = m.task;
  if (!t) return null;
  return (
    <View style={[styles.card, {marginBottom: 12}]}>
      <View style={styles.cardTop}>
        <View style={{flex: 1}}>
          <Text style={styles.cardName}>{t.name}</Text>
          <Text style={styles.typeText}>{t.type ?? 'image_link'}</Text>
        </View>
        <StatusPill status={m.status} />
      </View>
      <View style={styles.metaGroup}>
        <View style={styles.metaRow}><Icon name="calendar-outline" size={14} color="#6b7280" /><Text style={styles.metaText}>Fin {fmtDate(t.enddate)}</Text></View>
        <View style={styles.metaRow}><Icon name="cash-outline" size={14} color="#6b7280" /><Text style={styles.metaText}>Gain {Math.round(m.expected_gain)} F</Text></View>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnOutline} onPress={onOpen}><Text style={styles.btnOutlineText}>Détails</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnGreen} onPress={onOpen}><Text style={styles.btnGreenText}>Résultat</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function TermineeCard({m, onOpen}: {m: Mission; onOpen: () => void}) {
  const t = m.task;
  if (!t) return null;
  const isGain = m.status === 'SUBMISSION_ACCEPTED';
  return (
    <View style={styles.termRow}>
      <View style={styles.cardTop}>
        <View style={{flex: 1, marginRight: 8}}>
          <Text style={styles.cardName} numberOfLines={1}>{t.name}</Text>
          <Text style={styles.typeText}>{t.type ?? 'image_link'} · {fmtDate(t.startdate)} – {fmtDate(t.enddate)}</Text>
        </View>
        <StatusPill status={m.status} />
      </View>
      <View style={[styles.rowBetween, {marginTop: 8}]}>
        <View style={styles.metaRow}>
          <Icon name="cash-outline" size={14} color="#9ca3af" />
          <Text style={[styles.gainText, {color: isGain ? GREEN : '#6b7280'}]}>{isGain ? '+' : ''}{Math.round(m.gain || m.expected_gain)} F</Text>
        </View>
        <TouchableOpacity style={styles.voir} onPress={onOpen}>
          <Icon name="eye-outline" size={16} color={GREEN} />
          <Text style={styles.voirText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 2},
  chips: {flexDirection: 'row', gap: 12, marginTop: 16},
  chip: {flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)'},
  chipNum: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  chipLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  tabBar: {marginHorizontal: 16, marginTop: -24, backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  tab: {flex: 1, paddingVertical: 12, alignItems: 'center', gap: 2},
  tabActive: {backgroundColor: GREEN},
  tabLabel: {fontSize: font.size.xs, color: '#6b7280', fontWeight: font.weight.bold},
  tabLabelActive: {color: '#fff'},
  tabCount: {fontSize: 10, color: '#9ca3af'},
  filterCard: {backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', gap: 10},
  filterChipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  filterChip: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f3f4f6'},
  filterChipOn: {backgroundColor: GREEN},
  filterChipText: {fontSize: 10, color: '#6b7280', fontWeight: font.weight.bold},
  filterChipTextOn: {color: '#fff'},
  searchRow: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, height: 42},
  searchInput: {flex: 1, color: '#1f2937', fontSize: font.size.sm, padding: 0},
  dateRow: {flexDirection: 'row', gap: 10},
  resetBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start'},
  resetText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  tabBadge: {position: 'absolute', top: 6, right: 10, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  tabBadgeText: {fontSize: 10, fontWeight: font.weight.bold, color: GREEN},
  loader: {paddingVertical: 60, alignItems: 'center'},
  infoBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12},
  infoText: {flex: 1, color: '#1d4ed8', fontSize: font.size.xs},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  cardName: {color: '#1f2937', fontWeight: font.weight.bold, fontSize: font.size.sm, flex: 1, marginRight: 8},
  cardGain: {color: '#15803d', fontWeight: font.weight.bold, fontSize: font.size.sm},
  cat: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold, marginTop: 2},
  desc: {color: '#6b7280', fontSize: font.size.xs, marginTop: 8, lineHeight: 17},
  progRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  progMuted: {fontSize: 10, color: '#9ca3af'},
  progTrack: {height: 6, backgroundColor: '#f3f4f6', borderRadius: 3},
  progFill: {height: 6, backgroundColor: '#22c55e', borderRadius: 3},
  cardBottom: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {color: '#6b7280', fontSize: font.size.xs},
  metaGroup: {flexDirection: 'row', gap: 16, marginTop: 12},
  participate: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12},
  participateText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  typeText: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
  pill: {flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4},
  dot: {width: 6, height: 6, borderRadius: 3},
  pillText: {fontSize: 10, fontWeight: font.weight.bold},
  btnRow: {flexDirection: 'row', gap: 8, marginTop: 12},
  btnOutline: {flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'},
  btnOutlineText: {color: '#4b5563', fontSize: font.size.xs, fontWeight: font.weight.bold},
  btnGreen: {flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center'},
  btnGreenText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  cumulCard: {backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  cumulLabel: {color: '#6b7280', fontSize: font.size.xs},
  cumulValue: {color: GREEN, fontSize: font.size.xl, fontWeight: font.weight.bold, marginTop: 2},
  cumulIcon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center'},
  termList: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  termRow: {paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6'},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  gainText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  voir: {flexDirection: 'row', alignItems: 'center', gap: 4},
  voirText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  emptyText: {color: '#6b7280', fontSize: font.size.sm, textAlign: 'center'},
  retryBtn: {marginTop: 12, backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10},
  retryText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
