import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import type {MediaPartnerStackParamList} from '../navigation/MediaPartnerNavigator';
import {fetchMediaPartnerProfile, MediaPartnerProfile} from '../api/mediaPartnerProfile';
import {changePassword, requestDeletion} from '../api/profile';
import {apiErrorMessage} from '../api/client';
import {useAuth} from '../context/AuthContext';
import KycStatusCard from '../components/KycStatusCard';
import Icon from '../components/Icon';
import {font} from '../theme';

/**
 * Profil du Partenaire Média — sourcé de GET /media-partner/profile (chiffres de chaîne),
 * pas de /profile générique diffuseur (catégories/vuesmoyen ne s'appliquent pas ici).
 * Sécurité (mot de passe, suppression de compte) réutilise les endpoints génériques
 * /profile/change-password et /profile/delete-account (mêmes contrats que le diffuseur).
 */

type Nav = NativeStackNavigationProp<MediaPartnerStackParamList>;
const GREEN = '#1ba24b';

const STATUS_INFO: Record<string, {label: string; bg: string; fg: string}> = {
  actif: {label: 'Actif', bg: 'rgba(255,255,255,0.2)', fg: '#fff'},
  inactif: {label: 'Inactif', bg: 'rgba(250,204,21,0.25)', fg: '#fef08a'},
  off: {label: 'Désactivé', bg: 'rgba(239,68,68,0.3)', fg: '#fecaca'},
};

function fmt(n?: number | null) {
  return Math.round(Number(n ?? 0)).toLocaleString('fr-FR');
}
function fmtDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}
function initials(name?: string) {
  return (name ?? '').trim().slice(0, 2).toUpperCase() || 'WP';
}

function InfoRow({label, value}: {label: string; value?: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}
function Row({icon, label, description, onPress}: {icon: string; label: string; description?: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}><Icon name={icon} size={18} color={GREEN} /></View>
      <View style={{flex: 1}}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Icon name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function MediaPartnerProfileScreen() {
  const navigation = useNavigation<Nav>();
  const {signOut} = useAuth();
  const [p, setP] = useState<MediaPartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [sheet, setSheet] = useState<null | 'password' | 'delete'>(null);

  const load = useCallback(async () => {
    try {
      setP(await fetchMediaPartnerProfile());
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
  const pr = p;
  const statusInfo = pr ? (STATUS_INFO[pr.status] ?? {label: pr.status, bg: 'rgba(255,255,255,0.2)', fg: '#fff'}) : null;

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
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(pr?.channel_name)}</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.name} numberOfLines={1}>{pr?.channel_name ?? 'Ma chaîne'}</Text>
              <Text style={styles.email}>Partenaire Média WhatsPAY</Text>
              {!!statusInfo && (
                <View style={[styles.statusBadge, {backgroundColor: statusInfo.bg}]}>
                  <Text style={[styles.statusBadgeText, {color: statusInfo.fg}]}>{statusInfo.label}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroStats}>
            {[
              {value: `${fmt(pr?.followers_count)}`, label: 'Followers'},
              {value: `${fmt(pr?.reached_accounts_30d)}`, label: 'Comptes touchés (30j)'},
              {value: pr?.current_tier?.label ?? '—', label: 'Palier actuel'},
              {value: fmtDate(pr?.last_recapture_at), label: 'Dernière recapture'},
            ].map((s, i) => (
              <View key={i} style={styles.heroStat}>
                <Text style={styles.heroStatVal} numberOfLines={1}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <KycStatusCard />

          {/* Informations de la chaîne */}
          <View style={styles.card}>
            <Text style={styles.overline}>Informations de la chaîne</Text>
            <InfoRow label="Nom de la chaîne" value={pr?.channel_name} />
            <InfoRow label="Followers" value={fmt(pr?.followers_count)} />
            <InfoRow label="Comptes touchés (30j)" value={fmt(pr?.reached_accounts_30d)} />
            <InfoRow label="Palier actuel" value={pr?.current_tier ? `${pr.current_tier.label} (${fmt(pr.current_tier.flat_price)} F/mission)` : '—'} />
            <InfoRow label="Dernière recapture" value={fmtDate(pr?.last_recapture_at)} />
            {(pr?.country_coverage ?? []).map(c => (
              <InfoRow key={c.country_id} label={`Couverture — ${c.country}`} value={`${c.percentage}%`} />
            ))}
          </View>

          {/* Recapture */}
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('MediaPartnerRecapture')}>
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, {backgroundColor: '#dcfce7'}]}><Icon name="document-text-outline" size={18} color={GREEN} /></View>
              <View>
                <Text style={styles.linkText}>Recapture mensuelle</Text>
                <Text style={styles.linkSub}>Mettre à jour les chiffres de la chaîne</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Sécurité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sécurité</Text>
            <Row icon="lock-closed-outline" label="Changer le mot de passe" description="Sécuriser mon compte" onPress={() => setSheet('password')} />
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <Row icon="ticket-outline" label="Mes tickets" description="Contacter le support WhatsPAY" onPress={() => navigation.navigate('MediaPartnerTickets')} />
            <Row icon="help-circle-outline" label="FAQ" description="Questions fréquentes" onPress={() => navigation.navigate('MediaPartnerFaq')} />
          </View>

          {/* Zone de danger */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Zone de danger</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => setSheet('delete')}>
              <Icon name="trash-outline" size={16} color="#dc2626" />
              <Text style={styles.dangerBtnText}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {sheet === 'password' && <PasswordSheet onClose={() => setSheet(null)} />}
      {sheet === 'delete' && <DeleteSheet onClose={() => setSheet(null)} />}

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
    </View>
  );
}

function SheetShell({title, children, onClose}: {title: string; children: React.ReactNode; onClose: () => void}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}><Text style={styles.sheetCancelText}>Fermer</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PasswordSheet({onClose}: {onClose: () => void}) {
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [cf, setCf] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (nw.length < 8) return Alert.alert('Trop court', 'Au moins 8 caractères.');
    if (nw !== cf) return Alert.alert('Non concordant', 'La confirmation ne correspond pas.');
    setBusy(true);
    try {
      const r = await changePassword(cur, nw, cf);
      Alert.alert(r.success ? 'Succès' : 'Info', r.message);
      if (r.success) onClose();
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SheetShell title="Changer le mot de passe" onClose={onClose}>
      <TextInput style={styles.input} value={cur} onChangeText={setCur} secureTextEntry placeholder="Mot de passe actuel" placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} value={nw} onChangeText={setNw} secureTextEntry placeholder="Nouveau mot de passe (8 min.)" placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} value={cf} onChangeText={setCf} secureTextEntry placeholder="Confirmer" placeholderTextColor="#9ca3af" />
      <TouchableOpacity style={[styles.cta, busy && {opacity: 0.6}]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Mettre à jour</Text>}
      </TouchableOpacity>
    </SheetShell>
  );
}

function DeleteSheet({onClose}: {onClose: () => void}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = () => {
    if (reason.trim().length < 10) return Alert.alert('Motif requis', 'Explique la raison (10 caractères min).');
    Alert.alert('Supprimer mon compte', 'Action définitive. Confirmer la demande ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Confirmer', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          const r = await requestDeletion(reason.trim());
          Alert.alert(r.success ? 'Demande envoyée' : 'Info', r.message);
          if (r.success) onClose();
        } catch (e) {
          Alert.alert('Erreur', apiErrorMessage(e));
        } finally {
          setBusy(false);
        }
      }},
    ]);
  };
  return (
    <SheetShell title="Supprimer mon compte" onClose={onClose}>
      <Text style={styles.dangerNote}>Cette demande est traitée par l'équipe. Action irréversible.</Text>
      <TextInput style={[styles.input, {minHeight: 90, textAlignVertical: 'top'}]} value={reason} onChangeText={setReason} placeholder="Pourquoi souhaites-tu partir ?" placeholderTextColor="#9ca3af" multiline />
      <TouchableOpacity style={[styles.cta, {backgroundColor: '#ef4444'}, busy && {opacity: 0.6}]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Demander la suppression</Text>}
      </TouchableOpacity>
    </SheetShell>
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
  statusBadge: {alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4},
  statusBadgeText: {fontSize: 10, fontWeight: font.weight.bold},
  heroStats: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16},
  heroStat: {width: '47.5%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  heroStatVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  heroStatLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -24, gap: 16},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  overline: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, marginBottom: 12},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6'},
  infoLabel: {color: '#6b7280', fontSize: font.size.sm, flexShrink: 1},
  infoValue: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium, flexShrink: 1, textAlign: 'right', marginLeft: 12},
  linkCard: {backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  linkLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  linkIcon: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  linkText: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  linkSub: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
  section: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  sectionTitle: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12},
  rowIcon: {width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center'},
  rowLabel: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  rowDesc: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
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
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24},
  grabber: {width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16},
  sheetTitle: {color: '#1f2937', fontSize: font.size.md, fontWeight: font.weight.bold, marginBottom: 12},
  input: {backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.size.sm, color: '#1f2937', marginBottom: 12},
  cta: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  sheetCancel: {alignItems: 'center', paddingVertical: 12, marginTop: 4},
  sheetCancelText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
  dangerNote: {color: '#dc2626', fontSize: font.size.xs, marginBottom: 12},
});
