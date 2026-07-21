import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {fetchMission, Mission} from '../api/missions';
import {createComplaint} from '../api/complaints';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Submission'>;

const GREEN = '#16a34a';
const STATUS: Record<string, {label: string; bg: string; fg: string}> = {
  SUBMITED: {label: 'En vérification', bg: '#ffedd5', fg: '#c2410c'},
  SUBMISSION_ACCEPTED: {label: 'Validée', bg: '#dcfce7', fg: '#15803d'},
  SUBMISSION_REJECTED: {label: 'Rejetée', bg: '#fee2e2', fg: '#b91c1c'},
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
}

export default function SubmissionScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComplaint, setShowComplaint] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setMission(await fetchMission(id));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendComplaint = async () => {
    if (message.trim().length < 20) return;
    setSending(true);
    try {
      const r = await createComplaint(id, message.trim());
      setShowComplaint(false);
      setMessage('');
      Alert.alert("Réclamation", r.message);
      await load();
    } catch (e) {
      Alert.alert("Erreur", apiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (loading || !mission) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }

  const st = STATUS[mission.status] ?? {label: mission.status, bg: '#f3f4f6', fg: '#4b5563'};
  const isRejected = mission.status === 'SUBMISSION_REJECTED';
  const isCivic = !!mission.task?.is_civic;
  const isOnboarding = !!mission.task?.is_onboarding;
  const complaint = mission.complaint as any;
  const canComplain = !complaint && !isCivic && !isOnboarding;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{paddingBottom: 32}}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={16} color="#dcfce7" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Ma soumission</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{mission.vues > 0 ? mission.vues.toLocaleString('fr-FR') : '—'}</Text>
              <Text style={styles.statLabel}>Vues déclarées</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{Math.round(mission.gain || mission.expected_gain).toLocaleString('fr-FR')} F</Text>
              <Text style={styles.statLabel}>Gain</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Statut */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>STATUT</Text>
              <View style={[styles.pill, {backgroundColor: st.bg}]}><Text style={[styles.pillText, {color: st.fg}]}>{st.label}</Text></View>
            </View>
            <Text style={styles.subDate}>Soumis le {fmtDate(mission.submission_date)}</Text>
            {isRejected && (!!mission.reason_title || !!mission.reason_description) && (
              <View style={styles.rejBox}>
                {!!mission.reason_title && <Text style={styles.rejTitle}>{mission.reason_title}</Text>}
                {!!mission.reason_description && <Text style={styles.rejDesc}>{mission.reason_description}</Text>}
              </View>
            )}
          </View>

          {/* Capture */}
          <View style={styles.card}>
            <Text style={styles.label}>CAPTURE D'ÉCRAN</Text>
            {mission.files ? (
              <TouchableOpacity onPress={() => Linking.openURL(mission.files as string)} activeOpacity={0.9}>
                <Image source={{uri: mission.files as any}} style={styles.capture} resizeMode="cover" />
                <View style={styles.openRow}><Icon name="open-outline" size={14} color={GREEN} /><Text style={styles.openText}>Ouvrir en grand</Text></View>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noCapture}>Aucune capture disponible.</Text>
            )}
          </View>

          {/* Réclamation */}
          {complaint ? (
            <View style={styles.complaintCard}>
              <Text style={styles.complaintTitle}>Réclamation · {complaint.status}</Text>
              <Text style={styles.complaintMsg}>{complaint.message}</Text>
              {!!complaint.admin_note && <Text style={styles.complaintNote}>Réponse : {complaint.admin_note}</Text>}
            </View>
          ) : canComplain ? (
            <TouchableOpacity style={styles.complaintBtn} onPress={() => setShowComplaint(true)}>
              <Icon name="flag-outline" size={16} color="#ea580c" />
              <Text style={styles.complaintBtnText}>Un problème ? Déposer une réclamation</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.linkCampaign} onPress={() => navigation.navigate('MissionDetail', {id})}>
            <Text style={styles.linkCampaignText}>Voir la campagne</Text>
            <Icon name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal réclamation */}
      <Modal visible={showComplaint} transparent animationType="slide" onRequestClose={() => setShowComplaint(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Déposer une réclamation</Text>
            <Text style={styles.modalSub}>Explique le problème (20 caractères min.).</Text>
            <TextInput style={styles.textarea} value={message} onChangeText={setMessage} placeholder="Décris le problème…" placeholderTextColor="#9ca3af" multiline />
            <TouchableOpacity style={[styles.cta, (message.trim().length < 20 || sending) && {opacity: 0.5}]} onPress={sendComplaint} disabled={message.trim().length < 20 || sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Envoyer</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowComplaint(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40},
  back: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16},
  backText: {color: '#dcfce7', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  stats: {flexDirection: 'row', gap: 12, marginTop: 16},
  stat: {flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  statVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  statLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -16, gap: 16},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  label: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1},
  pill: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4},
  pillText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  subDate: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 8},
  rejBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 10, marginTop: 12},
  rejTitle: {color: '#b91c1c', fontSize: font.size.xs, fontWeight: font.weight.bold},
  rejDesc: {color: '#dc2626', fontSize: font.size.xs, marginTop: 4, lineHeight: 17},
  capture: {width: '100%', height: 260, borderRadius: 12, backgroundColor: '#f3f4f6'},
  openRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8},
  openText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  noCapture: {color: '#9ca3af', fontSize: font.size.sm, textAlign: 'center', paddingVertical: 16},
  complaintCard: {backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 16, padding: 16},
  complaintTitle: {color: '#c2410c', fontSize: font.size.xs, fontWeight: font.weight.bold},
  complaintMsg: {color: '#7c2d12', fontSize: font.size.sm, marginTop: 6},
  complaintNote: {color: '#9a3412', fontSize: font.size.xs, marginTop: 8},
  complaintBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 16, paddingVertical: 12},
  complaintBtnText: {color: '#c2410c', fontSize: font.size.sm, fontWeight: font.weight.bold},
  linkCampaign: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  linkCampaignText: {color: '#4b5563', fontSize: font.size.sm, fontWeight: font.weight.bold},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalSheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20},
  modalTitle: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold},
  modalSub: {color: '#6b7280', fontSize: font.size.sm, marginTop: 2, marginBottom: 12},
  textarea: {minHeight: 120, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: font.size.sm, color: '#1f2937', textAlignVertical: 'top', backgroundColor: '#f9fafb'},
  cta: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  modalCancel: {alignItems: 'center', paddingVertical: 12},
  modalCancelText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
});
