import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {useAuth} from '../context/AuthContext';
import {fetchProfile, ProfileData} from '../api/profile';
import KycStatusCard from '../components/KycStatusCard';
import ShareBadgeModal from '../components/ShareBadgeModal';
import Icon from '../components/Icon';
import {font} from '../theme';

function rateColor(v: number | null): string {
  if (v == null) return '#9ca3af';
  return v >= 70 ? '#16a34a' : v >= 40 ? '#eab308' : '#ef4444';
}
function PerfCard({label, value, color, sub}: {label: string; value: string; color: string; sub: string}) {
  return (
    <View style={styles.perfCard}>
      <Text style={styles.perfLabel2}>{label}</Text>
      <Text style={[styles.perfValue2, {color}]}>{value}</Text>
      <Text style={styles.perfSub}>{sub}</Text>
    </View>
  );
}

type Nav = NativeStackNavigationProp<AppStackParamList>;
const GREEN = '#16a34a';

const fmt = (n?: number | null) => Math.round(Number(n ?? 0)).toLocaleString('fr-FR');
function fmtDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}
function initials(p: any) {
  return ((p?.firstname?.[0] ?? '') + (p?.lastname?.[0] ?? '')).toUpperCase() || 'W';
}

function InfoRow({label, value}: {label: string; value?: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const {user, signOut} = useAuth();
  const [p, setP] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const load = useCallback(async () => {
    try {
      setP(await fetchProfile());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  const pr: any = p ?? {};
  const fullName = `${pr.firstname ?? user?.firstname ?? ''} ${pr.lastname ?? user?.lastname ?? ''}`.trim();

  const ar = pr.acceptance_rate != null ? Number(pr.acceptance_rate) : null;
  const cr = pr.completion_rate != null ? Number(pr.completion_rate) : null;
  const totalClics = Number(pr.total_clics ?? 0);
  const hasPerf = ar != null || cr != null || totalClics > 0;
  const reliability = ar != null || cr != null ? (cr ?? 0) * 0.6 + (ar ?? 0) * 0.4 : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{paddingBottom: 24}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor="#fff" colors={[GREEN]} />}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Mon profil</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogout(true)}>
              <Icon name="log-out-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(pr)}</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.name} numberOfLines={1}>{fullName || 'Diffuseur'}</Text>
              <Text style={styles.email} numberOfLines={1}>{pr.email ?? user?.email}</Text>
              <View style={styles.badges}>
                {pr.is_ambassador && <View style={styles.ambBadge}><Text style={styles.ambBadgeText}>★ Ambassadeur</Text></View>}
                {(pr.civic_count ?? 0) > 0 && <View style={styles.civicBadge}><Text style={styles.civicBadgeText}>🏛️ {pr.civic_count} citoyenne{pr.civic_count > 1 ? 's' : ''}</Text></View>}
              </View>
            </View>
          </View>

          <View style={styles.heroStats}>
            {[
              {value: `${fmt(pr.wallet_balance)} F`, label: 'Solde disponible'},
              {value: fmt(pr.completed_campaigns), label: 'Campagnes validées'},
              {value: fmt(pr.vuesmoyen), label: 'Vues moyennes'},
              {value: pr.completed_campaigns > 0 && pr.conversion_score != null ? `${Number(pr.conversion_score).toFixed(1)}%` : '—', label: 'Taux de conversion'},
            ].map((s, i) => (
              <View key={i} style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <KycStatusCard />

          {/* Partager mon badge */}
          <TouchableOpacity style={[styles.linkCard, pr.is_ambassador && {backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a'}]} onPress={() => setShowBadge(true)}>
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, {backgroundColor: pr.is_ambassador ? '#fef3c7' : '#dcfce7'}]}>
                <Icon name="share-social" size={18} color={pr.is_ambassador ? '#ca8a04' : GREEN} />
              </View>
              <View>
                <Text style={styles.linkText}>Partager mon badge</Text>
                <Text style={styles.linkSub}>{pr.is_ambassador ? 'Mon réseau. Mes gains.' : 'Je fais partie du mouvement.'}</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Performance */}
          {hasPerf && (
            <View style={styles.card}>
              <Text style={styles.overline}>Performance</Text>
              <View style={styles.perfGrid}>
                <PerfCard label="Taux d'acceptation" value={ar != null ? `${Number(ar.toFixed(1))}%` : '—'} color={rateColor(ar)} sub="soumissions validées" />
                <PerfCard label="Taux de complétion" value={cr != null ? `${Number(cr.toFixed(1))}%` : '—'} color={rateColor(cr)} sub="missions menées à bout" />
                <PerfCard label="Score de fiabilité" value={reliability != null ? `${Math.round(reliability)}/100` : '—'} color={rateColor(reliability)} sub="complétion + acceptation" />
                {totalClics > 0 && (
                  <PerfCard label="Clics générés" value={fmt(totalClics)} color="#2563eb" sub={`dont ${fmt(pr.unique_clics)} uniques`} />
                )}
              </View>
            </View>
          )}

          {/* Infos personnelles */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.overline}>Informations personnelles</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Text style={styles.editLink}>Modifier</Text></TouchableOpacity>
            </View>
            <InfoRow label="Téléphone" value={pr.phone} />
            <InfoRow label="Date de naissance" value={fmtDate(pr.birthdate)} />
            <InfoRow label="Pays" value={pr.country?.name} />
            <InfoRow label="Localité" value={pr.locality?.name} />
            <InfoRow label="Arrondissement" value={pr.arrondissement?.name} />
            <InfoRow label="Quartier" value={pr.quartier?.name} />
            <InfoRow label="Profession" value={pr.occupation?.name} />
          </View>

          {/* Catégories */}
          {!!pr.categories?.length && (
            <View style={styles.card}>
              <Text style={styles.overline}>Mes catégories</Text>
              <View style={styles.catWrap}>
                {pr.categories.map((c: any) => (
                  <View key={c.id} style={styles.catChip}><Text style={styles.catChipText}>{c.name}</Text></View>
                ))}
              </View>
            </View>
          )}

          {/* Ambassadeur */}
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Ambassador')}>
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, {backgroundColor: '#fef9c3'}]}><Icon name="share-social" size={18} color="#ca8a04" /></View>
              <Text style={styles.linkText}>Programme ambassadeur</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Zone de danger */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Zone de danger</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => navigation.navigate('Settings')}>
              <Icon name="trash-outline" size={16} color="#dc2626" />
              <Text style={styles.dangerBtnText}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Logout confirm */}
      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalSub}>Veux-tu vraiment te déconnecter ?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogout(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={() => {setShowLogout(false); signOut();}}><Text style={styles.modalConfirmText}>Déconnexion</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ShareBadgeModal
        visible={showBadge}
        onClose={() => setShowBadge(false)}
        firstname={pr.firstname ?? user?.firstname}
        lastname={pr.lastname ?? user?.lastname}
        isAmbassador={pr.is_ambassador}
        ambassadorCode={pr.ambassador_code}
        completedCampaigns={pr.completed_campaigns}
        reliability={reliability}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  heroTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  logoutBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'},
  logoutText: {color: 'rgba(255,255,255,0.8)', fontSize: font.size.xs},
  identity: {flexDirection: 'row', alignItems: 'center', gap: 16},
  avatar: {width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  avatarText: {color: '#fff', fontSize: font.size.xl, fontWeight: font.weight.bold},
  name: {color: '#fff', fontSize: font.size.lg, fontWeight: font.weight.bold},
  email: {color: 'rgba(255,255,255,0.7)', fontSize: font.size.xs},
  badges: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4},
  ambBadge: {backgroundColor: 'rgba(250,204,21,0.2)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2},
  ambBadgeText: {color: '#fef08a', fontSize: 10, fontWeight: font.weight.bold},
  civicBadge: {backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2},
  civicBadgeText: {color: '#fff', fontSize: 10, fontWeight: font.weight.bold},
  heroStats: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16},
  heroStat: {width: '47.5%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  heroStatVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  heroStatLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -24, gap: 16},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  overline: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, marginBottom: 12},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  editLink: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold, marginBottom: 12},
  perfRow: {flexDirection: 'row', gap: 12},
  perfItem: {flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center'},
  perfVal: {color: GREEN, fontSize: font.size.xl, fontWeight: font.weight.bold},
  perfLabel: {color: '#6b7280', fontSize: 10, marginTop: 2, textAlign: 'center'},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6'},
  infoLabel: {color: '#6b7280', fontSize: font.size.sm},
  infoValue: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium, flexShrink: 1, textAlign: 'right', marginLeft: 12},
  catWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  catChip: {backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6},
  catChipText: {color: '#15803d', fontSize: font.size.xs, fontWeight: font.weight.medium},
  linkCard: {backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  linkLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  linkIcon: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  linkText: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  linkSub: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
  perfGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  perfCard: {width: '47%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12},
  perfLabel2: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.medium},
  perfValue2: {fontSize: font.size.xl, fontWeight: font.weight.bold, marginTop: 4},
  perfSub: {color: '#9ca3af', fontSize: 9, marginTop: 2},
  dangerCard: {backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fee2e2'},
  dangerTitle: {color: '#b91c1c', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, marginBottom: 12},
  dangerBtn: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10},
  dangerBtnText: {color: '#dc2626', fontSize: font.size.sm, fontWeight: font.weight.bold},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24},
  modalCard: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%'},
  modalTitle: {color: '#1f2937', fontSize: font.size.md, fontWeight: font.weight.bold},
  modalSub: {color: '#6b7280', fontSize: font.size.sm, marginTop: 4, marginBottom: 16},
  modalBtns: {flexDirection: 'row', gap: 12},
  modalCancel: {flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'},
  modalCancelText: {color: '#4b5563', fontSize: font.size.sm, fontWeight: font.weight.bold},
  modalConfirm: {flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: '#ef4444', alignItems: 'center'},
  modalConfirmText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
