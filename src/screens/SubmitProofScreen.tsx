import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {fetchMission, Mission, ProofFile, submitProof} from '../api/missions';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'SubmitProof'>;

const GREEN = '#16a34a';
const RULES = [
  'Image claire et non floue',
  'Le contenu diffusé entièrement visible',
  'La photo de profil WhatsApp apparaît',
  "La date et l'heure du statut sont visibles",
  'La barre de statut du téléphone est visible (confirme l\'heure système)',
  'Aucune retouche, filtre, zoom ni recadrage abusif',
  'Capture faite depuis votre propre smartphone (pas un émulateur)',
  'Capture récente — prise le jour de la soumission',
];

export default function SubmitProofScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [vues, setVues] = useState('');
  const [proof, setProof] = useState<ProofFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [onbSuccess, setOnbSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      setMission(await fetchMission(id));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pick = async () => {
    const res = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (res.didCancel) return;
    const a = res.assets?.[0];
    if (a?.uri) setProof({uri: a.uri, type: a.type, fileName: a.fileName ?? undefined});
  };

  const isResub = mission?.status === 'SUBMITED';
  const isCivic = !!mission?.task?.is_civic;
  const isOnboarding = !!mission?.task?.is_onboarding;

  const openRules = () => {
    setError(null);
    if (!proof && !isResub) {
      setError("Veuillez sélectionner une capture d'écran.");
      return;
    }
    if (!vues || isNaN(Number(vues)) || Number(vues) < 0) {
      setError('Veuillez saisir un nombre de vues valide.');
      return;
    }
    setAgreed(false);
    setShowRules(true);
  };

  const submit = async () => {
    if (!proof && !isResub) return;
    setSubmitting(true);
    try {
      const r = await submitProof(id, Number(vues), proof ?? ({} as ProofFile));
      setShowRules(false);
      if (r.success) {
        if (isOnboarding) setOnbSuccess(true);
        else navigation.goBack();
      } else {
        setError(r.message ?? 'Une erreur est survenue.');
      }
    } catch (e) {
      setShowRules(false);
      setError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !mission) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  const t = mission.task;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={16} color="#dcfce7" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{isResub ? 'Modifier ma soumission' : 'Soumettre ma preuve'}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>{t?.name ?? 'Campagne'}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{isCivic ? 'Bénévolat' : `${Math.round(mission.expected_gain)} F`}</Text>
              <Text style={styles.statLabel}>{isCivic ? 'Non rémunérée' : 'Gain prévu'}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{isOnboarding ? '⭐' : (t?.enddate ? new Date(t.enddate).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'}) : '—')}</Text>
              <Text style={styles.statLabel}>{isOnboarding ? 'Mission de bienvenue' : 'Date limite'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {isResub && (
            <View style={styles.warnBox}>
              <Icon name="alert-circle-outline" size={16} color="#f97316" />
              <View style={{flex: 1}}>
                <Text style={styles.warnTitle}>Soumission en attente de validation</Text>
                <Text style={styles.warnSub}>Vous pouvez modifier votre capture ou les vues tant que l'admin n'a pas traité votre dossier.</Text>
              </View>
            </View>
          )}

          {/* Vues */}
          <View style={styles.card}>
            <Text style={styles.label}>NOMBRE DE VUES *</Text>
            <TextInput
              style={styles.input}
              value={vues}
              onChangeText={setVues}
              placeholder={isResub && mission.vues ? String(mission.vues) : 'Ex. 350'}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>Indiquez le nombre de vues affiché sur votre statut WhatsApp au moment de la capture.</Text>
          </View>

          {/* Capture */}
          <View style={styles.card}>
            <Text style={styles.label}>CAPTURE D'ÉCRAN {!isResub ? '*' : ''}</Text>
            {isResub && !!mission.files && !proof && (
              <View style={styles.existing}>
                <Image source={{uri: mission.files as any}} style={styles.previewImg} resizeMode="cover" />
                <Text style={styles.existingText}>Capture actuelle — conservée si vous n'en téléversez pas une nouvelle</Text>
              </View>
            )}
            {!!proof && (
              <View style={styles.previewWrap}>
                <Image source={{uri: proof.uri}} style={styles.previewImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setProof(null)}>
                  <Icon name="close" size={16} color="#4b5563" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.picker} onPress={pick} activeOpacity={0.8}>
              <Icon name="image-outline" size={20} color="#6b7280" />
              <Text style={styles.pickerText}>{proof?.fileName ?? 'Sélectionner une capture'}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Capture claire de votre statut WhatsApp avec le contenu et le compteur de vues visibles.</Text>
          </View>

          {/* Info */}
          {isOnboarding ? (
            <View style={styles.onbInfo}>
              <Icon name="star" size={18} color="#ca8a04" />
              <View style={{flex: 1}}>
                <Text style={styles.onbInfoTitle}>Mission de bienvenue</Text>
                <Text style={styles.onbInfoText}>Votre soumission sera validée automatiquement. C'est votre première mission pour découvrir WhatsPAY !</Text>
              </View>
            </View>
          ) : (
            <View style={styles.blueInfo}>
              <Icon name="information-circle-outline" size={16} color="#3b82f6" />
              <Text style={styles.blueInfoText}>En soumettant, vous confirmez que les informations sont exactes. La soumission sera vérifiée avant paiement.</Text>
            </View>
          )}

          {!!error && <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}

          <TouchableOpacity style={styles.cta} onPress={openRules} activeOpacity={0.85}>
            <Text style={styles.ctaText}>{isResub ? 'Mettre à jour ma soumission' : 'Soumettre ma preuve'}</Text>
          </TouchableOpacity>

          {/* Règles */}
          <View style={styles.card}>
            <Text style={styles.label}>RÈGLES DE LA CAPTURE</Text>
            {RULES.map(r => (
              <View key={r} style={styles.ruleRow}>
                <Icon name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.ruleText}>{r}</Text>
              </View>
            ))}
            <Text style={styles.warnLine}>⚠ Toute capture non conforme entraîne un rejet immédiat.</Text>
            <Text style={styles.warnLineBold}>⛔ Toute falsification entraîne la désactivation définitive du compte.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal règles + accord */}
      <Modal visible={showRules} transparent animationType="slide" onRequestClose={() => setShowRules(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Avant de soumettre</Text>
            <Text style={styles.modalSub}>Confirme que ta capture respecte les règles :</Text>
            <ScrollView style={{maxHeight: 220}}>
              {RULES.map(r => (
                <View key={r} style={styles.ruleRow}>
                  <Icon name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, agreed && styles.checkboxOn]}>{agreed && <Icon name="checkmark" size={12} color="#fff" />}</View>
              <Text style={styles.agreeText}>Je confirme que ma capture est authentique et conforme.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cta, (!agreed || submitting) && {opacity: 0.5}]} onPress={submit} disabled={!agreed || submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Confirmer et soumettre</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRules(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal succès onboarding */}
      <Modal visible={onbSuccess} transparent animationType="slide">
        <View style={styles.modalBackdropDark}>
          <View style={styles.successSheet}>
            <View style={styles.successHead}>
              <View style={styles.successCircle}><Icon name="checkmark" size={36} color="#fff" /></View>
              <Text style={styles.successTitle}>Bravo, mission complétée !</Text>
              <Text style={styles.successSub}>Tu as terminé ton onboarding WhatsPAY</Text>
            </View>
            <View style={{padding: 24}}>
              <TouchableOpacity style={styles.cta} onPress={() => {setOnbSuccess(false); navigation.navigate('Tabs', {screen: 'Campagnes'});}}>
                <Text style={styles.ctaText}>Découvrir les campagnes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  back: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16},
  backText: {color: '#dcfce7', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 2},
  stats: {flexDirection: 'row', gap: 12, marginTop: 16},
  stat: {flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  statVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  statLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -24, gap: 16},
  warnBox: {backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  warnTitle: {color: '#c2410c', fontSize: font.size.xs, fontWeight: font.weight.bold},
  warnSub: {color: '#ea580c', fontSize: font.size.xs, marginTop: 2},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  label: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, marginBottom: 8},
  input: {backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#1f2937', fontSize: font.size.sm},
  hint: {color: '#9ca3af', fontSize: 10, marginTop: 6},
  existing: {marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6'},
  existingText: {textAlign: 'center', color: '#9ca3af', fontSize: 10, paddingVertical: 6, backgroundColor: '#f9fafb'},
  previewWrap: {marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#bbf7d0', position: 'relative'},
  previewImg: {width: '100%', height: 190},
  removeBtn: {position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3},
  picker: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 12},
  pickerText: {color: '#6b7280', fontSize: font.size.sm},
  onbInfo: {backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  onbInfoTitle: {color: '#854d0e', fontSize: font.size.xs, fontWeight: font.weight.bold},
  onbInfoText: {color: '#a16207', fontSize: font.size.xs, marginTop: 2},
  blueInfo: {backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  blueInfoText: {flex: 1, color: '#1d4ed8', fontSize: font.size.xs, lineHeight: 17},
  errBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10},
  errText: {color: '#dc2626', fontSize: font.size.xs},
  cta: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  ruleRow: {flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8},
  ruleText: {flex: 1, color: '#4b5563', fontSize: font.size.xs, lineHeight: 17},
  warnLine: {color: '#ef4444', fontSize: 10, fontWeight: font.weight.bold, marginTop: 6},
  warnLineBold: {color: '#dc2626', fontSize: 10, fontWeight: font.weight.bold, marginTop: 4},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalBackdropDark: {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  modalSheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20},
  modalTitle: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold},
  modalSub: {color: '#6b7280', fontSize: font.size.sm, marginTop: 2, marginBottom: 12},
  agreeRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12},
  checkbox: {width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center'},
  checkboxOn: {backgroundColor: GREEN, borderColor: GREEN},
  agreeText: {flex: 1, color: '#4b5563', fontSize: font.size.xs},
  modalCancel: {alignItems: 'center', paddingVertical: 12, marginTop: 4},
  modalCancelText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
  successSheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden'},
  successHead: {backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center'},
  successCircle: {width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  successTitle: {color: '#fff', fontSize: font.size.xl, fontWeight: font.weight.bold},
  successSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 4},
});
