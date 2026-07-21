import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {acceptMission, fetchMission, Mission} from '../api/missions';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MissionDetail'>;

const GREEN = '#16a34a';
const STEPS = ['Assignée', 'En cours', 'Soumise', 'Validée'];
const STEP_STATUS: Record<string, number> = {
  ASSIGNED: 0, PENDING: 1, SUBMITED: 2, SUBMISSION_ACCEPTED: 3, SUBMISSION_REJECTED: 2, EXPIRED: 1,
};
const PILL: Record<string, {label: string; bg: string; fg: string}> = {
  ASSIGNED: {label: 'Disponible', bg: '#dbeafe', fg: '#1d4ed8'},
  PENDING: {label: 'En cours', bg: '#dbeafe', fg: '#1d4ed8'},
  SUBMITED: {label: 'Soumise', bg: '#ffedd5', fg: '#c2410c'},
  SUBMISSION_ACCEPTED: {label: 'Validée', bg: '#dcfce7', fg: '#15803d'},
  SUBMISSION_REJECTED: {label: 'Rejetée', bg: '#fee2e2', fg: '#b91c1c'},
  EXPIRED: {label: 'Expirée', bg: '#fee2e2', fg: '#b91c1c'},
};
const STEP_MSG: Record<string, string> = {
  SUBMISSION_ACCEPTED: 'Mission validée. Votre gain a été crédité sur votre compte.',
  SUBMITED: "Vos résultats sont en cours de vérification par l'équipe. Ce processus prend généralement entre 2 et 7 jours ouvrés.",
  PENDING: 'Soumettez votre preuve avant la date limite pour être payé.',
  ASSIGNED: 'Acceptez cette mission pour commencer.',
  SUBMISSION_REJECTED: 'Votre soumission a été rejetée.',
  EXPIRED: 'Cette mission a expiré sans soumission.',
};
const MSG_COLOR: Record<string, {bg: string; bd: string; fg: string}> = {
  SUBMISSION_ACCEPTED: {bg: '#f0fdf4', bd: '#bbf7d0', fg: '#166534'},
  SUBMITED: {bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e40af'},
  PENDING: {bg: '#fffbeb', bd: '#fde68a', fg: '#92400e'},
  ASSIGNED: {bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e40af'},
  SUBMISSION_REJECTED: {bg: '#fef2f2', bd: '#fecaca', fg: '#991b1b'},
  EXPIRED: {bg: '#fef2f2', bd: '#fecaca', fg: '#991b1b'},
};

function fmtDate(d?: string | null, withTime = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = {day: '2-digit', month: '2-digit', year: 'numeric'};
  if (withTime) {opts.hour = '2-digit'; opts.minute = '2-digit';}
  return dt.toLocaleDateString('fr-FR', opts);
}
const isVideo = (f?: string, mt?: string) => mt === 'video' || (!!f && /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(f));
const isImage = (f?: string, mt?: string) => mt === 'image' || (!!f && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(f));

function Card({title, icon, children}: {title?: string; icon?: string; children: React.ReactNode}) {
  return (
    <View style={styles.card}>
      {!!title && (
        <View style={styles.cardHead}>
          {!!icon && <Icon name={icon} size={14} color="#9ca3af" />}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

export default function MissionDetailScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [legendCopied, setLegendCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setMission(await fetchMission(id));
    } catch {
      // 401 global
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async () => {
    setAccepting(true);
    try {
      await acceptMission(id);
    } catch (e) {
      Alert.alert('Oups', apiErrorMessage(e, "Impossible d'accepter la mission."));
    } finally {
      await load();
      setAccepting(false);
    }
  };

  const copy = (text: string, which: 'link' | 'legend') => {
    Clipboard.setString(text);
    if (which === 'legend') {setLegendCopied(true); setTimeout(() => setLegendCopied(false), 2000);}
    else {setCopied(true); setTimeout(() => setCopied(false), 2000);}
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  if (!mission) {
    return (
      <View style={styles.loader}>
        <Text style={{color: '#6b7280'}}>Mission introuvable.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color: GREEN, marginTop: 8}}>Retour</Text></TouchableOpacity>
      </View>
    );
  }

  const t = mission.task;
  const st = mission.status;
  const pill = PILL[st] ?? {label: st, bg: '#f3f4f6', fg: '#4b5563'};
  const stepIdx = STEP_STATUS[st] ?? 0;
  const isAssigned = st === 'ASSIGNED';
  const isPending = st === 'PENDING';
  const isSubmited = st === 'SUBMITED';
  const isDone = st === 'SUBMISSION_ACCEPTED';
  const isRejected = st === 'SUBMISSION_REJECTED';
  const isCivic = !!t?.is_civic;
  const isOnboarding = !!t?.is_onboarding;
  const link = mission.tracking_url ?? t?.url ?? '';
  const msgColor = MSG_COLOR[st] ?? {bg: '#f9fafb', bd: '#f3f4f6', fg: '#374151'};

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{paddingBottom: isAssigned || isPending || isSubmited || isDone ? 110 : 24}}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Icon name="chevron-back" size={20} color="#fff" />
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
            <View style={[styles.pill, {backgroundColor: pill.bg}]}><Text style={[styles.pillText, {color: pill.fg}]}>{pill.label}</Text></View>
          </View>
          <Text style={styles.heroTitle}>{t?.name ?? '—'}</Text>
          <Text style={styles.heroSub}>Détails de la mission</Text>
          <View style={styles.quick}>
            {[
              {label: 'Début', value: fmtDate(t?.startdate)},
              {label: 'Fin', value: fmtDate(t?.enddate)},
              {label: isCivic ? 'Type' : 'Gain', value: isCivic ? 'Bénévolat' : `${Math.round(mission.expected_gain)} F`},
            ].map(s => (
              <View key={s.label} style={styles.quickItem}>
                <Text style={styles.quickVal}>{s.value}</Text>
                <Text style={styles.quickLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {isCivic && (
            <View style={styles.civic}>
              <Icon name="ribbon-outline" size={18} color="#ca8a04" />
              <Text style={styles.civicText}>Campagne citoyenne — participation libre et bénévole.</Text>
            </View>
          )}

          {/* Stepper */}
          <Card>
            <Text style={styles.overline}>Progression</Text>
            <View style={styles.stepper}>
              {STEPS.map((step, i) => {
                const done = i < stepIdx;
                const current = i === stepIdx;
                const rej = isRejected && i === 2;
                return (
                  <View key={step} style={styles.step}>
                    {i < STEPS.length - 1 && <View style={[styles.connector, {backgroundColor: done ? '#22c55e' : '#e5e7eb'}]} />}
                    <View style={[styles.circle, rej ? styles.circleRej : done ? styles.circleDone : current ? styles.circleCur : styles.circleTodo]}>
                      {done ? <Icon name="checkmark" size={16} color="#fff" /> : <View style={[styles.innerDot, {backgroundColor: current ? '#fff' : '#e5e7eb'}]} />}
                    </View>
                    <Text style={[styles.stepLabel, {color: done || current ? '#374151' : '#9ca3af'}]}>{step}</Text>
                  </View>
                );
              })}
            </View>

            <View style={[styles.msgBox, {backgroundColor: msgColor.bg, borderColor: msgColor.bd}]}>
              <Icon name="information-circle-outline" size={16} color={msgColor.fg} />
              <Text style={[styles.msgText, {color: msgColor.fg}]}>{STEP_MSG[st]}</Text>
            </View>

            {isRejected && !!mission.reason_title && (
              <View style={styles.rejBox}>
                <Text style={styles.rejTitle}>{mission.reason_title}</Text>
                {!!mission.reason_description && <Text style={styles.rejDesc}>{mission.reason_description}</Text>}
              </View>
            )}

            {(isSubmited || isDone || isRejected) && (
              <TouchableOpacity style={styles.seeSub} onPress={() => navigation.navigate('Submission', {id: mission.id})}>
                <Text style={styles.seeSubText}>Voir ma soumission</Text>
                <Icon name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </Card>

          {/* Onboarding banners */}
          {isOnboarding && (isAssigned || isPending) && (
            <View style={styles.onbBox}>
              <Icon name="star" size={22} color="#ca8a04" />
              <View style={{flex: 1}}>
                <Text style={styles.onbTitle}>{isAssigned ? "Mission de bienvenue — lis bien avant d'accepter" : "C'est parti ! Voici ce que tu dois faire"}</Text>
                {(isAssigned
                  ? ["Accepte la mission ci-dessous", "Télécharge l'image et copie la légende fournie", 'Poste sur ton statut WhatsApp', 'Reviens dans 24h pour soumettre avec le nombre de vues']
                  : ['Ouvre WhatsApp', 'Poste l\'image avec la légende sur ton statut', 'Attends que tes contacts voient le statut', 'Reviens ici dans 24h et soumets le screenshot avec le nombre de vues']
                ).map((s, i) => (
                  <View key={i} style={styles.onbStep}>
                    <View style={styles.onbNum}><Text style={styles.onbNumText}>{i + 1}</Text></View>
                    <Text style={styles.onbStepText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats conversion */}
          {t?.campaign_type === 'conversion' && !isAssigned && mission.tracking_stats && (
            <Card title="VOS STATISTIQUES DE CONVERSION" icon="stats-chart-outline">
              <View style={styles.convGrid}>
                {[
                  {label: 'Clics totaux', value: mission.tracking_stats.total_clicks, fg: '#1d4ed8', bg: '#eff6ff'},
                  {label: 'Clics uniques', value: mission.tracking_stats.unique_clicks, fg: '#4338ca', bg: '#eef2ff'},
                  {label: 'Conversions', value: mission.tracking_stats.conversions, fg: '#15803d', bg: '#f0fdf4'},
                  {label: 'Taux', value: `${mission.tracking_stats.conversion_rate}%`, fg: '#c2410c', bg: '#fff7ed'},
                ].map(s => (
                  <View key={s.label} style={[styles.convItem, {backgroundColor: s.bg}]}>
                    <Text style={[styles.convVal, {color: s.fg}]}>{s.value}</Text>
                    <Text style={styles.convLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Fiche campagne */}
          {t && (
            <Card title="INFORMATIONS DE LA CAMPAGNE" icon="document-text-outline">
              {[
                {label: 'Nom de la campagne', value: t.name},
                {label: 'Annonceur', value: t.client_name || '—'},
                {label: 'Type de média', value: t.type ?? '—'},
                {label: "Date d'assignation", value: fmtDate(mission.assignment_date, true)},
                {label: 'Période', value: `Du ${fmtDate(t.startdate)} au ${fmtDate(t.enddate)}`},
                {label: 'Gain prévu', value: `${Math.round(mission.expected_gain)} F CFA`},
              ].map(row => (
                <View key={row.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
              {!!t.category?.name && (
                <View style={[styles.infoRow, {borderBottomWidth: 0}]}>
                  <Text style={styles.infoLabel}>Catégorie</Text>
                  <View style={styles.catPill}><Text style={styles.catPillText}>{t.category.name}</Text></View>
                </View>
              )}
            </Card>
          )}

          {/* Description */}
          {!!t?.description && (
            <Card title="DESCRIPTION">
              <Text style={styles.descText}>{t.description}</Text>
            </Card>
          )}

          {/* Contenu verrouillé */}
          {isAssigned && (
            <View style={[styles.card, {flexDirection: 'row', alignItems: 'center', gap: 12}]}>
              <View style={styles.lockIcon}><Icon name="lock-closed-outline" size={20} color="#9ca3af" /></View>
              <View style={{flex: 1}}>
                <Text style={styles.lockTitle}>Contenu disponible après acceptation</Text>
                <Text style={styles.lockSub}>Le média et la légende à diffuser seront révélés une fois la mission acceptée.</Text>
              </View>
            </View>
          )}

          {/* Instructions */}
          {!isAssigned && (!!t?.legend || !!link) && (
            <Card title="INSTRUCTIONS">
              {!!t?.legend && !!link ? (
                <View style={styles.amber}>
                  <Text style={styles.amberLabel}>TEXTE À COPIER DANS VOTRE STATUT</Text>
                  <Text style={styles.amberText}>{t.legend}</Text>
                  <Text style={styles.linkMono}>{link}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => copy(`${t.legend}\n\n${link}`, 'legend')}>
                    <Icon name={legendCopied ? 'checkmark' : 'copy-outline'} size={13} color="#b45309" />
                    <Text style={styles.copyText}>{legendCopied ? 'Copié ✓' : 'Copier légende + lien'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {!!t?.legend && (
                    <View style={[styles.amber, {marginBottom: 12}]}>
                      <Text style={styles.amberLabel}>LÉGENDE À COPIER DANS VOTRE STATUT</Text>
                      <Text style={styles.amberText}>{t.legend}</Text>
                      <TouchableOpacity style={styles.copyBtn} onPress={() => copy(t.legend!, 'legend')}>
                        <Icon name={legendCopied ? 'checkmark' : 'copy-outline'} size={13} color="#b45309" />
                        <Text style={styles.copyText}>{legendCopied ? 'Copié ✓' : 'Copier la légende'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!!link && (
                    <>
                      <View style={styles.linkRow}>
                        <Text style={styles.linkMonoFlex} numberOfLines={1}>{link}</Text>
                        <TouchableOpacity style={styles.copyInline} onPress={() => copy(link, 'link')}>
                          <Icon name={copied ? 'checkmark' : 'copy-outline'} size={14} color={GREEN} />
                          <Text style={styles.copyInlineText}>{copied ? 'Copié ✓' : 'Copier'}</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.hint}>Copiez ce lien et insérez-le directement dans votre statut WhatsApp.</Text>
                    </>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Média à diffuser */}
          {!isAssigned && !!t?.files && (
            <Card title="MÉDIA À DIFFUSER" icon="film-outline">
              <View style={styles.mediaBox}>
                {isImage(t.files, t.media_type) ? (
                  <Image source={{uri: t.files}} style={styles.mediaImg} resizeMode="cover" />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Icon name={isVideo(t.files, t.media_type) ? 'play-circle-outline' : 'film-outline'} size={40} color="#9ca3af" />
                    <Text style={styles.mediaPhText}>Média de la campagne</Text>
                  </View>
                )}
              </View>
              <View style={styles.mediaBtns}>
                <TouchableOpacity style={styles.mediaOutline} onPress={() => Linking.openURL(t.files!)}>
                  <Icon name="eye-outline" size={16} color="#4b5563" />
                  <Text style={styles.mediaOutlineText}>Aperçu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaGreen} onPress={() => Linking.openURL(t.files!)}>
                  <Icon name="download-outline" size={16} color="#fff" />
                  <Text style={styles.mediaGreenText}>Télécharger</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* CTA fixe */}
      {isDone ? (
        <View style={styles.ctaWrap}>
          <View style={styles.ctaDone}>
            <Icon name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.ctaDoneText}>Gain de {Math.round(mission.gain || mission.expected_gain)} F CFA crédité</Text>
          </View>
        </View>
      ) : isAssigned ? (
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaGreen} onPress={accept} disabled={accepting} activeOpacity={0.85}>
            {accepting ? <ActivityIndicator color="#fff" /> : <><Icon name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.ctaText}>Accepter la mission</Text></>}
          </TouchableOpacity>
        </View>
      ) : isPending ? (
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaGreen} onPress={() => navigation.navigate('SubmitProof', {id: mission.id})} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Soumettre ma preuve</Text>
          </TouchableOpacity>
        </View>
      ) : isSubmited ? (
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={[styles.ctaGreen, {backgroundColor: '#f97316'}]} onPress={() => navigation.navigate('SubmitProof', {id: mission.id})} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Modifier ma soumission</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32},
  navRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  back: {flexDirection: 'row', alignItems: 'center', gap: 2},
  backText: {color: '#fff', fontSize: font.size.sm},
  pill: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4},
  pillText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  heroTitle: {color: '#fff', fontSize: font.size.xl, fontWeight: font.weight.bold, lineHeight: 26},
  heroSub: {color: '#dcfce7', fontSize: font.size.xs, marginTop: 2},
  quick: {flexDirection: 'row', gap: 12, marginTop: 16},
  quickItem: {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  quickVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.sm},
  quickLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -8, gap: 16, paddingTop: 8},
  civic: {flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, padding: 12},
  civicText: {flex: 1, color: '#854d0e', fontSize: font.size.xs},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12},
  cardTitle: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1},
  overline: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1.5, marginBottom: 16},
  stepper: {flexDirection: 'row', alignItems: 'flex-start'},
  step: {flex: 1, alignItems: 'center'},
  connector: {position: 'absolute', top: 15, left: '50%', right: 0, height: 2, width: '100%'},
  circle: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 1},
  circleDone: {borderColor: '#22c55e', backgroundColor: '#22c55e'},
  circleCur: {borderColor: '#f97316', backgroundColor: '#f97316'},
  circleTodo: {borderColor: '#e5e7eb', backgroundColor: '#fff'},
  circleRej: {borderColor: '#ef4444', backgroundColor: '#ef4444'},
  innerDot: {width: 10, height: 10, borderRadius: 5},
  stepLabel: {fontSize: 9, marginTop: 6, fontWeight: font.weight.medium, textAlign: 'center'},
  msgBox: {flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 16, alignItems: 'flex-start'},
  msgText: {flex: 1, fontSize: font.size.xs, lineHeight: 17},
  rejBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12},
  rejTitle: {color: '#b91c1c', fontSize: font.size.xs, fontWeight: font.weight.bold},
  rejDesc: {color: '#dc2626', fontSize: font.size.xs, marginTop: 4, lineHeight: 17},
  seeSub: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12},
  seeSubText: {color: '#4b5563', fontSize: font.size.xs, fontWeight: font.weight.bold},
  onbBox: {backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  onbTitle: {color: '#854d0e', fontSize: font.size.sm, fontWeight: font.weight.bold, marginBottom: 6},
  onbStep: {flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 4},
  onbNum: {width: 16, height: 16, borderRadius: 8, backgroundColor: '#fde047', alignItems: 'center', justifyContent: 'center', marginTop: 1},
  onbNumText: {color: '#713f12', fontSize: 10, fontWeight: font.weight.bold},
  onbStepText: {flex: 1, color: '#a16207', fontSize: font.size.xs},
  convGrid: {flexDirection: 'row', gap: 8},
  convItem: {flex: 1, borderRadius: 12, padding: 10, alignItems: 'center'},
  convVal: {fontSize: font.size.md, fontWeight: font.weight.bold},
  convLabel: {color: '#6b7280', fontSize: 9, marginTop: 2, textAlign: 'center'},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 10},
  infoLabel: {color: '#6b7280', fontSize: font.size.xs},
  infoValue: {color: '#1f2937', fontSize: font.size.xs, fontWeight: font.weight.medium, textAlign: 'right', flexShrink: 1},
  catPill: {backgroundColor: '#f0fdf4', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2},
  catPillText: {color: '#15803d', fontSize: 10, fontWeight: font.weight.bold},
  descText: {color: '#374151', fontSize: font.size.sm, lineHeight: 21},
  lockIcon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center'},
  lockTitle: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.bold},
  lockSub: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 2},
  amber: {backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  amberLabel: {color: '#92400e', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 0.5, marginBottom: 6},
  amberText: {color: '#78350f', fontSize: font.size.sm, lineHeight: 20},
  linkMono: {color: '#15803d', fontSize: font.size.xs, marginTop: 8},
  copyBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10},
  copyText: {color: '#b45309', fontSize: 10, fontWeight: font.weight.bold},
  linkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  linkMonoFlex: {flex: 1, color: '#15803d', fontSize: font.size.xs},
  copyInline: {flexDirection: 'row', alignItems: 'center', gap: 4},
  copyInlineText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  hint: {color: '#9ca3af', fontSize: 10, marginTop: 8},
  mediaBox: {backgroundColor: '#f3f4f6', borderRadius: 12, overflow: 'hidden', marginBottom: 12},
  mediaImg: {width: '100%', height: 192},
  mediaPlaceholder: {height: 160, alignItems: 'center', justifyContent: 'center', gap: 8},
  mediaPhText: {color: '#9ca3af', fontSize: font.size.sm, fontWeight: font.weight.medium},
  mediaBtns: {flexDirection: 'row', gap: 8},
  mediaOutline: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb'},
  mediaOutlineText: {color: '#4b5563', fontSize: font.size.xs, fontWeight: font.weight.bold},
  mediaGreen: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: GREEN},
  mediaGreenText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  ctaWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, backgroundColor: 'transparent'},
  ctaGreen: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  ctaDone: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  ctaDoneText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
