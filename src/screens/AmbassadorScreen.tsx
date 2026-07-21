import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {activateAmbassador, AmbassadorData, enterAmbassadorCode, fetchAmbassador} from '../api/ambassador';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Ambassador'>;

const GREEN = '#16a34a';
const YELLOW = '#eab308';

function fmtDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

const STEPS = [
  'Partagez votre code de parrainage à vos contacts.',
  "Ils s'inscrivent sur WhatsPAY avec votre code et participent à des campagnes.",
  'Pour chaque filleul actif, votre gain par vue augmente de +0,01 F.',
  'Plus vous avez de filleuls actifs, plus vous gagnez sur chaque campagne !',
];

export default function AmbassadorScreen({navigation}: Props) {
  const [data, setData] = useState<AmbassadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await fetchAmbassador());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const copy = (c: string) => {
    Clipboard.setString(c);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = (c: string) => {
    Share.share({message: `Rejoins WhatsPAY avec mon code ambassadeur ${c} et monétise tes Status WhatsApp ! https://whatspay.africa`}).catch(() => {});
  };

  const submitCode = async () => {
    if (!code.trim()) return;
    setCodeBusy(true);
    setCodeError(null);
    try {
      const r = await enterAmbassadorCode(code.trim().toUpperCase());
      if (r.success) setCodeSuccess(r.message);
      else setCodeError(r.message);
    } catch (e) {
      setCodeError(apiErrorMessage(e));
    } finally {
      setCodeBusy(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    setActivateError(null);
    try {
      const r = await activateAmbassador();
      if (r.success) await load();
      else setActivateError(r.message);
    } catch (e) {
      setActivateError(apiErrorMessage(e));
    } finally {
      setActivating(false);
    }
  };

  if (loading || !data) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  const isAmb = data.is_ambassador;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        {/* Hero */}
        <View style={[styles.hero, {backgroundColor: isAmb ? YELLOW : GREEN}]}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Programme Ambassadeur</Text>
          <Text style={styles.heroSub}>{isAmb ? 'Vous êtes ambassadeur WhatsPAY ★' : 'Parrainez et gagnez plus'}</Text>
          {isAmb && data.stat && (
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statVal}>{data.stat.active_referrals}</Text><Text style={styles.statLabel}>Filleuls actifs</Text></View>
              <View style={styles.stat}><Text style={styles.statVal}>{data.stat.total_referrals}</Text><Text style={styles.statLabel}>Total filleuls</Text></View>
              <View style={styles.stat}><Text style={styles.statVal}>{data.gain_per_view.toFixed(2)} F</Text><Text style={styles.statLabel}>/ vue</Text></View>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Code parrainage */}
          {isAmb && !!data.ambassador_code && (
            <View style={styles.card}>
              <Text style={styles.overline}>Mon code de parrainage</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{data.ambassador_code}</Text>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity style={styles.codeBtn} onPress={() => copy(data.ambassador_code!)}>
                    <Icon name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#a16207" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.codeBtn} onPress={() => share(data.ambassador_code!)}>
                    <Icon name="share-social-outline" size={18} color="#a16207" />
                  </TouchableOpacity>
                </View>
              </View>
              {copied && <Text style={styles.copiedHint}>Code copié ✓</Text>}
            </View>
          )}

          {/* Entrer un code */}
          {!data.has_referrer && (
            <View style={styles.card}>
              <Text style={styles.overline}>Code ambassadeur</Text>
              <Text style={styles.cardSub}>Tu as été parrainé ? Entre le code de ton ambassadeur pour rejoindre son réseau.</Text>
              {codeSuccess ? (
                <View style={styles.successBox}>
                  <Icon name="checkmark-circle" size={16} color={GREEN} />
                  <Text style={styles.successText}>{codeSuccess}</Text>
                </View>
              ) : (
                <View style={styles.codeForm}>
                  <TextInput
                    style={styles.codeInput}
                    value={code}
                    onChangeText={t => {setCode(t.toUpperCase()); setCodeError(null);}}
                    placeholder="Ex. JEAN2024"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                  <TouchableOpacity style={[styles.validateBtn, (!code.trim() || codeBusy) && {opacity: 0.5}]} onPress={submitCode} disabled={!code.trim() || codeBusy}>
                    {codeBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.validateText}>Valider</Text>}
                  </TouchableOpacity>
                </View>
              )}
              {!!codeError && <Text style={styles.errorText}>{codeError}</Text>}
            </View>
          )}

          {/* Comment ça marche */}
          <View style={styles.card}>
            <Text style={styles.overline}>Comment ça marche</Text>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Éligibilité */}
          {!isAmb && (
            <View style={[styles.eligBox, data.is_eligible ? styles.eligOk : styles.eligNo]}>
              <View style={styles.eligHead}>
                <Icon name={data.is_eligible ? 'checkmark-circle' : 'warning-outline'} size={20} color={data.is_eligible ? GREEN : '#9ca3af'} />
                <Text style={[styles.eligTitle, {color: data.is_eligible ? '#15803d' : '#4b5563'}]}>{data.is_eligible ? 'Vous êtes éligible au programme !' : 'Pas encore éligible'}</Text>
              </View>
              <Text style={[styles.eligText, {color: data.is_eligible ? '#16a34a' : '#6b7280'}]}>
                {data.is_eligible
                  ? 'Vous avez atteint 1 000 F de retraits validés. Générez votre code dès maintenant pour commencer à parrainer.'
                  : 'Pour devenir ambassadeur, vous devez avoir effectué au moins 1 000 F de retraits validés sur WhatsPAY.'}
              </Text>
              {data.is_eligible && (
                <>
                  {!!activateError && <Text style={styles.errorText}>{activateError}</Text>}
                  <TouchableOpacity style={styles.genBtn} onPress={activate} disabled={activating}>
                    {activating ? <ActivityIndicator color="#fff" /> : <><Icon name="sparkles-outline" size={16} color="#fff" /><Text style={styles.genText}>Générer mon code ambassadeur</Text></>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Filleuls */}
          {isAmb && (
            <View style={styles.card}>
              <Text style={styles.overline}>Mes filleuls ({data.referrals.length})</Text>
              {data.referrals.length === 0 ? (
                <Text style={styles.emptyRef}>Aucun filleul pour l'instant.</Text>
              ) : (
                data.referrals.map(r => (
                  <View key={r.id} style={styles.refRow}>
                    <View>
                      <Text style={styles.refName}>{r.name}</Text>
                      <Text style={styles.refDate}>Inscrit le {fmtDate(r.joined_at)}</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.refMissions}>{r.missions ?? 0}</Text>
                      <Text style={styles.refDate}>missions</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {paddingHorizontal: 20, paddingTop: 16, paddingBottom: 56},
  back: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12},
  backText: {color: 'rgba(255,255,255,0.85)', fontSize: font.size.sm},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: 'rgba(255,255,255,0.85)', fontSize: font.size.sm, marginTop: 2},
  stats: {flexDirection: 'row', gap: 12, marginTop: 16},
  stat: {flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  statVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  statLabel: {color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -40, gap: 16},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  overline: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, marginBottom: 12},
  cardSub: {color: '#9ca3af', fontSize: font.size.xs, marginBottom: 12, marginTop: -6},
  codeBox: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14},
  codeText: {color: '#854d0e', fontWeight: font.weight.bold, fontSize: font.size.xl, letterSpacing: 3},
  codeBtn: {width: 40, height: 40, borderRadius: 10, backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center'},
  copiedHint: {color: GREEN, fontSize: font.size.xs, marginTop: 8, fontWeight: font.weight.bold},
  successBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12},
  successText: {color: '#15803d', fontSize: font.size.sm, fontWeight: font.weight.medium, flex: 1},
  codeForm: {flexDirection: 'row', gap: 8},
  codeInput: {flex: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: font.size.sm, color: '#1f2937', letterSpacing: 2},
  validateBtn: {backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center'},
  validateText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  errorText: {color: '#ef4444', fontSize: font.size.xs, marginTop: 8},
  stepRow: {flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12},
  stepNum: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center'},
  stepNumText: {color: '#15803d', fontWeight: font.weight.bold, fontSize: font.size.xs},
  stepText: {flex: 1, color: '#4b5563', fontSize: font.size.sm, lineHeight: 20},
  eligBox: {borderRadius: 16, padding: 16, borderWidth: 1},
  eligOk: {backgroundColor: '#f0fdf4', borderColor: '#bbf7d0'},
  eligNo: {backgroundColor: '#f9fafb', borderColor: '#e5e7eb'},
  eligHead: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  eligTitle: {fontSize: font.size.sm, fontWeight: font.weight.bold},
  eligText: {fontSize: font.size.xs, lineHeight: 18},
  genBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 12, marginTop: 12},
  genText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  emptyRef: {color: '#9ca3af', fontSize: font.size.sm, textAlign: 'center', paddingVertical: 16},
  refRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6'},
  refName: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.medium},
  refDate: {color: '#9ca3af', fontSize: 10},
  refMissions: {color: '#15803d', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
