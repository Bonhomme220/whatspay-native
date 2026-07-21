import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {Select} from '../components/Select';
import {changePassword, fetchProfile, requestDeletion, updateLocation} from '../api/profile';
import {fetchArrondissements, fetchQuartiers, Ref} from '../api/reference';
import {useAuth} from '../context/AuthContext';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;
const GREEN = '#16a34a';

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Row({icon, label, description, onPress, first}: {icon: string; label: string; description?: string; onPress: () => void; first?: boolean}) {
  return (
    <TouchableOpacity style={[styles.row, !first && styles.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}><Icon name={icon} size={18} color={GREEN} /></View>
      <View style={{flex: 1}}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Icon name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({navigation}: Props) {
  const {signOut} = useAuth();
  const [sheet, setSheet] = useState<null | 'password' | 'location' | 'delete'>(null);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={16} color="rgba(255,255,255,0.8)" /><Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Paramètres</Text>
        <Text style={styles.heroSub}>Préférences & sécurité</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Section title="Mon compte">
          <Row first icon="person-outline" label="Mon profil" description="Voir mes informations personnelles" onPress={() => navigation.navigate('Tabs', {screen: 'Profil'})} />
          <Row icon="lock-closed-outline" label="Changer le mot de passe" description="Sécuriser mon compte" onPress={() => setSheet('password')} />
          <Row icon="location-outline" label="Préciser ma localisation" description="Arrondissement & quartier" onPress={() => setSheet('location')} />
        </Section>

        <Section title="Support">
          <Row first icon="ticket-outline" label="Mes tickets" description="Contacter le support WhatsPAY" onPress={() => navigation.navigate('Tickets')} />
          <Row icon="help-circle-outline" label="FAQ" description="Questions fréquentes" onPress={() => navigation.navigate('Faq')} />
          <Row icon="flag-outline" label="Mes réclamations" description="Suivre mes réclamations de soumission" onPress={() => navigation.navigate('Complaints')} />
        </Section>

        <Section title="Programme">
          <Row first icon="share-social-outline" label="Programme ambassadeur" description="Parrainez et augmentez vos gains" onPress={() => navigation.navigate('Ambassador')} />
        </Section>

        <Section title="À propos">
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Version de l'application</Text><Text style={styles.aboutValue}>v2.1.0</Text></View>
          <View style={[styles.aboutRow, styles.rowBorder]}><Text style={styles.aboutLabel}>© 2026 WhatsPAY</Text><Text style={styles.aboutValue}>Tous droits réservés</Text></View>
        </Section>

        <TouchableOpacity style={styles.logoutCard} onPress={() => setShowLogout(true)}>
          <Icon name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteLink} onPress={() => setSheet('delete')}>
          <Text style={styles.deleteLinkText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </ScrollView>

      {sheet === 'password' && <PasswordSheet onClose={() => setSheet(null)} />}
      {sheet === 'location' && <LocationSheet onClose={() => setSheet(null)} />}
      {sheet === 'delete' && <DeleteSheet onClose={() => setSheet(null)} />}

      <Modal visible={showLogout} transparent animationType="slide" onRequestClose={() => setShowLogout(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Déconnexion</Text>
            <Text style={styles.sheetSub}>Voulez-vous vraiment vous déconnecter ?</Text>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowLogout(false)}><Text style={styles.outlineText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={() => {setShowLogout(false); signOut();}}><Text style={styles.dangerText}>Déconnexion</Text></TouchableOpacity>
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

function LocationSheet({onClose}: {onClose: () => void}) {
  const [localityId, setLocalityId] = useState<string | null>(null);
  const [arrs, setArrs] = useState<Ref[]>([]);
  const [quartiers, setQuartiers] = useState<Ref[]>([]);
  const [arrId, setArrId] = useState('');
  const [quartierId, setQuartierId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProfile().then(p => {
      setLocalityId((p as any).locality?.id ?? null);
      setArrId((p as any).arrondissement?.id ?? '');
      setQuartierId((p as any).quartier?.id ?? '');
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (localityId) fetchArrondissements(localityId).then(setArrs).catch(() => {});
  }, [localityId]);
  useEffect(() => {
    if (arrId) fetchQuartiers(arrId).then(setQuartiers).catch(() => {});
    else setQuartiers([]);
  }, [arrId]);

  const submit = async () => {
    if (!arrId || !quartierId) return Alert.alert('Champs requis', 'Choisis arrondissement et quartier.');
    setBusy(true);
    try {
      const r = await updateLocation(arrId, quartierId);
      Alert.alert(r.success ? 'Succès' : 'Info', r.message);
      if (r.success) onClose();
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SheetShell title="Préciser ma localisation" onClose={onClose}>
      <Select label="Arrondissement" options={arrs} value={arrId} onChange={v => {setArrId(v); setQuartierId('');}} disabled={!localityId} />
      <Select label="Quartier" options={quartiers} value={quartierId} onChange={setQuartierId} disabled={!arrId} />
      <TouchableOpacity style={[styles.cta, busy && {opacity: 0.6}]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Enregistrer</Text>}
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
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40},
  back: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12},
  backText: {color: 'rgba(255,255,255,0.8)', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: 'rgba(255,255,255,0.7)', fontSize: font.size.sm, marginTop: 2},
  body: {padding: 16, marginTop: -24, gap: 16},
  section: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  sectionTitle: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12},
  rowBorder: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f3f4f6'},
  rowIcon: {width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center'},
  rowLabel: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  rowDesc: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 1},
  aboutRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12},
  aboutLabel: {color: '#4b5563', fontSize: font.size.sm},
  aboutValue: {color: '#9ca3af', fontSize: font.size.xs},
  logoutCard: {backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  logoutText: {color: '#ef4444', fontSize: font.size.sm, fontWeight: font.weight.bold},
  deleteLink: {alignItems: 'center', paddingVertical: 8},
  deleteLinkText: {color: '#9ca3af', fontSize: font.size.xs},
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24},
  grabber: {width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16},
  sheetTitle: {color: '#1f2937', fontSize: font.size.md, fontWeight: font.weight.bold, marginBottom: 12},
  sheetSub: {color: '#9ca3af', fontSize: font.size.sm, marginBottom: 16},
  sheetBtns: {flexDirection: 'row', gap: 12},
  outlineBtn: {flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'},
  outlineText: {color: '#4b5563', fontSize: font.size.sm, fontWeight: font.weight.bold},
  dangerBtn: {flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#ef4444', alignItems: 'center'},
  dangerText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  input: {backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.size.sm, color: '#1f2937', marginBottom: 12},
  cta: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  sheetCancel: {alignItems: 'center', paddingVertical: 12, marginTop: 4},
  sheetCancelText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
  dangerNote: {color: '#dc2626', fontSize: font.size.xs, marginBottom: 12},
});
