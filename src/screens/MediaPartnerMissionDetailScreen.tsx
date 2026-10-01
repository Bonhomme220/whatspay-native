import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import type {MediaPartnerStackParamList} from '../navigation/MediaPartnerNavigator';
import {
  acceptMediaPartnerMission,
  fetchMediaPartnerMission,
  MediaPartnerMission,
  MediaPartnerProofFile,
  submitMediaPartnerMission,
} from '../api/mediaPartnerMissions';
import {apiErrorMessage} from '../api/client';
import {downloadMediaToDevice} from '../lib/downloadMedia';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<MediaPartnerStackParamList, 'MediaPartnerMissionDetail'>;

const GREEN = '#1ba24b';

// Délai minimum entre l'acceptation d'une mission et la soumission de la preuve, côté
// Partenaire Média — doit rester identique à la règle backend (contrat /media-partner/missions).
const SUBMIT_WAIT_HOURS = 24;

const PILL: Record<string, {label: string; bg: string; fg: string}> = {
  ASSIGNED: {label: 'Disponible', bg: '#dbeafe', fg: '#1d4ed8'},
  PENDING: {label: 'En cours', bg: '#dbeafe', fg: '#1d4ed8'},
  SUBMITED: {label: 'Soumise', bg: '#ffedd5', fg: '#c2410c'},
  SUBMISSION_ACCEPTED: {label: 'Validée', bg: '#dcfce7', fg: '#15803d'},
  SUBMISSION_REJECTED: {label: 'Rejetée', bg: '#fee2e2', fg: '#b91c1c'},
  EXPIRED: {label: 'Expirée', bg: '#fee2e2', fg: '#b91c1c'},
};

function fmtDate(d?: string | null, withTime = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = {day: '2-digit', month: '2-digit', year: 'numeric'};
  if (withTime) {opts.hour = '2-digit'; opts.minute = '2-digit';}
  return dt.toLocaleDateString('fr-FR', opts);
}

function fmtCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

const isImageMedia = (f?: string | null, mt?: string) => mt === 'image' || (!!f && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(f));
const isVideoMedia = (f?: string | null, mt?: string) => mt === 'video' || (!!f && /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(f));

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

/** Rappel persistant : exigence WhatsApp de mention "collaboration commerciale" (pas un champ de formulaire). */
function CollabComercialeNote() {
  return (
    <View style={styles.collabNote}>
      <Icon name="megaphone-outline" size={16} color="#92400e" />
      <Text style={styles.collabNoteText}>
        Rappel : WhatsApp exige que votre publication mentionne clairement « collaboration commerciale ».
      </Text>
    </View>
  );
}

export default function MediaPartnerMissionDetailScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [mission, setMission] = useState<MediaPartnerMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Formulaire de soumission (aussi utilisé pour modifier une soumission SUBMITED).
  const [editing, setEditing] = useState(false);
  const [postLink, setPostLink] = useState('');
  const [vues, setVues] = useState('');
  const [proof, setProof] = useState<MediaPartnerProofFile | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const m = await fetchMediaPartnerMission(id);
      setMission(m);
      setPostLink(prev => (prev ? prev : m.post_link ?? ''));
      setVues(prev => (prev ? prev : m.vues ? String(m.vues) : ''));
    } catch {
      // 401 global géré par l'intercepteur
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async () => {
    setAccepting(true);
    try {
      await acceptMediaPartnerMission(id);
    } catch (e) {
      Alert.alert('Oups', apiErrorMessage(e, "Impossible d'accepter la mission."));
    } finally {
      await load();
      setAccepting(false);
    }
  };

  const pickProof = async () => {
    const res = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (res.didCancel) return;
    const a = res.assets?.[0];
    if (a?.uri) setProof({uri: a.uri, type: a.type, fileName: a.fileName ?? undefined});
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
  const isAssigned = st === 'ASSIGNED';
  const isPending = st === 'PENDING';
  const isSubmited = st === 'SUBMITED';
  const isDone = st === 'SUBMISSION_ACCEPTED';
  const isRejected = st === 'SUBMISSION_REJECTED';
  const isExpired = st === 'EXPIRED';
  const requiresScreenshot = !!mission.requires_screenshot;

  // Soumission déverrouillée 24h après l'acceptation (response_date).
  const acceptedAtMs = mission.response_date ? new Date(mission.response_date).getTime() : null;
  const submitUnlockMs = acceptedAtMs !== null ? acceptedAtMs + SUBMIT_WAIT_HOURS * 3_600_000 : null;
  const submitRemainingMs = submitUnlockMs !== null ? submitUnlockMs - now : 0;
  const canSubmit = submitUnlockMs === null || submitRemainingMs <= 0;

  const showForm = isPending || (isSubmited && editing);

  const validate = (): string | null => {
    if (!postLink.trim() || !/^https?:\/\/\S+/.test(postLink.trim())) {
      return 'Indiquez le lien de votre publication sur la chaîne WhatsApp (doit commencer par http:// ou https://).';
    }
    if (requiresScreenshot) {
      if (!vues.trim() || isNaN(Number(vues)) || Number(vues) < 0) {
        return 'Indiquez le nombre de vues affiché sur votre publication.';
      }
      if (!proof && !isSubmited) {
        return "Ajoutez la capture d'écran de votre publication.";
      }
    }
    return null;
  };

  const submit = async () => {
    setFormError(null);
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitMediaPartnerMission(id, {
        postLink: postLink.trim(),
        vues: requiresScreenshot ? Number(vues) : undefined,
        file: requiresScreenshot ? proof : undefined,
      });
      setEditing(false);
      Alert.alert('Preuve soumise', res.message ?? 'Votre mission est en attente de validation par notre équipe.');
      await load();
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{paddingBottom: isAssigned || showForm ? 110 : 24}}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Icon name="chevron-back" size={20} color="#fff" />
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
            <View style={[styles.pill, {backgroundColor: pill.bg}]}><Text style={[styles.pillText, {color: pill.fg}]}>{pill.label}</Text></View>
          </View>
          <Text style={styles.heroTitle}>{t.name}</Text>
          {!!t.client_name && <Text style={styles.heroSub}>{t.client_name}</Text>}
          {!!t.campaign_type && (
            <View style={{marginTop: 8}}>
              <View style={[styles.typeBadge, t.campaign_type === 'conversion' ? styles.typeBadgeConversion : styles.typeBadgeNotoriete]}>
                <Text style={styles.typeBadgeText}>{t.campaign_type === 'conversion' ? '🎯 Campagne conversion' : '📢 Campagne notoriété'}</Text>
              </View>
            </View>
          )}
          <View style={styles.quick}>
            {[
              {label: 'Début', value: fmtDate(t.startdate)},
              {label: 'Fin', value: fmtDate(t.enddate)},
              {label: 'Gain prévu', value: `${Math.round(mission.expected_gain)} F`},
            ].map(s => (
              <View key={s.label} style={styles.quickItem}>
                <Text style={styles.quickVal}>{s.value}</Text>
                <Text style={styles.quickLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {isRejected && !!mission.reason_title && (
            <View style={styles.rejBox}>
              <Text style={styles.rejTitle}>{mission.reason_title}</Text>
              {!!mission.reason_description && <Text style={styles.rejDesc}>{mission.reason_description}</Text>}
            </View>
          )}

          {isExpired && (
            <View style={styles.expiredBox}>
              <Icon name="time-outline" size={16} color="#b91c1c" />
              <Text style={styles.expiredText}>Cette mission a expiré sans soumission.</Text>
            </View>
          )}

          {/* Stats de clics (conversion) */}
          {!isAssigned && mission.tracking_stats && (
            <Card title="STATISTIQUES DE CONVERSION" icon="stats-chart-outline">
              <View style={styles.convItem}>
                <Text style={styles.convVal}>{mission.tracking_stats.unique_clicks}</Text>
                <Text style={styles.convLabel}>Clics uniques</Text>
              </View>
            </Card>
          )}

          {/* Fiche campagne */}
          <Card title="INFORMATIONS DE LA CAMPAGNE" icon="document-text-outline">
            {[
              {label: 'Nom de la campagne', value: t.name},
              {label: 'Annonceur', value: t.client_name || '—'},
              {label: 'Type de média', value: t.media_type ?? '—'},
              {label: "Date d'assignation", value: fmtDate(mission.assignment_date, true)},
              {label: 'Période', value: `Du ${fmtDate(t.startdate)} au ${fmtDate(t.enddate)}`},
              {label: 'Gain prévu', value: `${Math.round(mission.expected_gain)} F CFA`},
            ].map(row => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </Card>

          {/* Description */}
          {!!t.description && (
            <Card title="DESCRIPTION">
              <Text style={styles.descText}>{t.description}</Text>
            </Card>
          )}

          {/* Contenu verrouillé avant acceptation */}
          {isAssigned && (
            <View style={[styles.card, {flexDirection: 'row', alignItems: 'center', gap: 12}]}>
              <View style={styles.lockIcon}><Icon name="lock-closed-outline" size={20} color="#9ca3af" /></View>
              <View style={{flex: 1}}>
                <Text style={styles.lockTitle}>Contenu disponible après acceptation</Text>
                <Text style={styles.lockSub}>Le média et la légende à publier seront révélés une fois la mission acceptée.</Text>
              </View>
            </View>
          )}

          {/* Légende + média à publier */}
          {!isAssigned && (!!t.legend || !!t.files) && (
            <Card title="CONTENU À PUBLIER SUR VOTRE CHAÎNE" icon="film-outline">
              {!!t.legend && (
                <View style={styles.amber}>
                  <Text style={styles.amberLabel}>LÉGENDE</Text>
                  <Text style={styles.amberText}>{t.legend}</Text>
                </View>
              )}
              {!!t.files && (
                <View style={[styles.mediaBox, {marginTop: t.legend ? 12 : 0}]}>
                  {isImageMedia(t.files, t.media_type) ? (
                    <Image source={{uri: t.files}} style={styles.mediaImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Icon name={isVideoMedia(t.files, t.media_type) ? 'play-circle-outline' : 'document-outline'} size={40} color="#9ca3af" />
                      <Text style={styles.mediaPhText}>Média de la campagne</Text>
                    </View>
                  )}
                </View>
              )}
              {!!t.files && (
                <TouchableOpacity style={styles.mediaGreen} onPress={() => downloadMediaToDevice(t.files!, t.media_type)}>
                  <Icon name="download-outline" size={16} color="#fff" />
                  <Text style={styles.mediaGreenText}>Télécharger le média</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Résumé lecture seule (soumise / validée / rejetée / expirée) */}
          {(isSubmited || isDone || isRejected || isExpired) && !editing && (
            <Card title="VOTRE SOUMISSION" icon="link-outline">
              {!!mission.post_link ? (
                <View style={styles.linkRow}>
                  <Text style={styles.linkMonoFlex} numberOfLines={1}>{mission.post_link}</Text>
                  <TouchableOpacity style={styles.copyInline} onPress={() => Linking.openURL(mission.post_link!)}>
                    <Icon name="open-outline" size={14} color={GREEN} />
                    <Text style={styles.copyInlineText}>Ouvrir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.infoValue}>Aucun lien soumis.</Text>
              )}
              {requiresScreenshot && !!mission.vues && (
                <View style={[styles.infoRow, {marginTop: 10}]}>
                  <Text style={styles.infoLabel}>Vues déclarées</Text>
                  <Text style={styles.infoValue}>{mission.vues}</Text>
                </View>
              )}
              {isDone && (
                <View style={[styles.infoRow, {borderBottomWidth: 0, marginTop: 10}]}>
                  <Text style={styles.infoLabel}>Gain obtenu</Text>
                  <Text style={[styles.infoValue, {color: GREEN, fontWeight: font.weight.bold}]}>
                    {Math.round(mission.gain || mission.expected_gain)} F CFA
                  </Text>
                </View>
              )}
              {isSubmited && (
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Icon name="create-outline" size={14} color={GREEN} />
                  <Text style={styles.editBtnText}>Modifier ma soumission</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* Formulaire de soumission (PENDING, ou modification d'une SUBMITED) */}
          {showForm && (
            <>
              <Card title={isSubmited ? 'MODIFIER MA SOUMISSION' : 'SOUMETTRE MA PREUVE'} icon="cloud-upload-outline">
                <Text style={styles.label}>LIEN DE LA PUBLICATION *</Text>
                <TextInput
                  style={styles.input}
                  value={postLink}
                  onChangeText={setPostLink}
                  placeholder="https://whatsapp.com/channel/.../123"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.hint}>Collez le lien de votre publication sur votre chaîne WhatsApp.</Text>

                {requiresScreenshot && (
                  <>
                    <Text style={[styles.label, {marginTop: 16}]}>NOMBRE DE VUES *</Text>
                    <TextInput
                      style={styles.input}
                      value={vues}
                      onChangeText={setVues}
                      placeholder={isSubmited && mission.vues ? String(mission.vues) : 'Ex. 350'}
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                    />
                    <Text style={styles.hint}>Nombre de vues affiché sur votre publication au moment de la capture.</Text>

                    <Text style={[styles.label, {marginTop: 16}]}>CAPTURE D'ÉCRAN {!isSubmited ? '*' : ''}</Text>
                    {!!proof && (
                      <View style={styles.previewWrap}>
                        <Image source={{uri: proof.uri}} style={styles.previewImg} resizeMode="cover" />
                        <TouchableOpacity style={styles.removeBtn} onPress={() => setProof(null)}>
                          <Icon name="close" size={16} color="#4b5563" />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity style={styles.picker} onPress={pickProof} activeOpacity={0.8}>
                      <Icon name="image-outline" size={20} color="#6b7280" />
                      <Text style={styles.pickerText}>{proof?.fileName ?? 'Sélectionner une capture'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>
                      {isSubmited ? 'Laissez vide pour conserver la capture déjà envoyée.' : 'Capture claire de votre publication avec le compteur de vues visible.'}
                    </Text>
                  </>
                )}

                <CollabComercialeNote />

                {!!formError && <View style={styles.errBox}><Text style={styles.errText}>{formError}</Text></View>}
              </Card>

              {isSubmited && (
                <TouchableOpacity style={styles.cancelEditBtn} onPress={() => {setEditing(false); setFormError(null); setProof(null);}}>
                  <Text style={styles.cancelEditText}>Annuler la modification</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* CTA fixe */}
      {isAssigned ? (
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaGreen} onPress={accept} disabled={accepting} activeOpacity={0.85}>
            {accepting ? <ActivityIndicator color="#fff" /> : <><Icon name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.ctaText}>Accepter la mission</Text></>}
          </TouchableOpacity>
        </View>
      ) : showForm ? (
        <View style={styles.ctaWrap}>
          {canSubmit ? (
            <TouchableOpacity style={styles.ctaGreen} onPress={submit} disabled={submitting} activeOpacity={0.85}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{isSubmited ? 'Mettre à jour ma soumission' : 'Soumettre ma preuve'}</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.ctaGreen, styles.ctaGreenDisabled]}>
                <Text style={styles.ctaText}>Soumettre ma preuve</Text>
              </View>
              <Text style={styles.ctaCountdown}>Disponible dans {fmtCountdown(submitRemainingMs)}</Text>
            </>
          )}
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
  typeBadge: {alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1},
  typeBadgeNotoriete: {backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)'},
  typeBadgeConversion: {backgroundColor: 'rgba(251,146,60,0.25)', borderColor: 'rgba(254,215,170,0.4)'},
  typeBadgeText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  quick: {flexDirection: 'row', gap: 12, marginTop: 16},
  quickItem: {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  quickVal: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.sm},
  quickLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  body: {paddingHorizontal: 16, marginTop: -8, gap: 16, paddingTop: 8},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12},
  cardTitle: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1},
  rejBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  rejTitle: {color: '#b91c1c', fontSize: font.size.xs, fontWeight: font.weight.bold},
  rejDesc: {color: '#dc2626', fontSize: font.size.xs, marginTop: 4, lineHeight: 17},
  expiredBox: {flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  expiredText: {flex: 1, color: '#b91c1c', fontSize: font.size.xs},
  convItem: {borderRadius: 12, padding: 10, alignItems: 'center', backgroundColor: '#eef2ff'},
  convVal: {fontSize: font.size.md, fontWeight: font.weight.bold, color: '#4338ca'},
  convLabel: {color: '#6b7280', fontSize: 9, marginTop: 2, textAlign: 'center'},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 10},
  infoLabel: {color: '#6b7280', fontSize: font.size.xs},
  infoValue: {color: '#1f2937', fontSize: font.size.xs, fontWeight: font.weight.medium, textAlign: 'right', flexShrink: 1},
  descText: {color: '#374151', fontSize: font.size.sm, lineHeight: 21},
  lockIcon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center'},
  lockTitle: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.bold},
  lockSub: {color: '#9ca3af', fontSize: font.size.xs, marginTop: 2},
  amber: {backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  amberLabel: {color: '#92400e', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 0.5, marginBottom: 6},
  amberText: {color: '#78350f', fontSize: font.size.sm, lineHeight: 20},
  mediaBox: {backgroundColor: '#f3f4f6', borderRadius: 12, overflow: 'hidden'},
  mediaImg: {width: '100%', height: 192},
  mediaPlaceholder: {height: 160, alignItems: 'center', justifyContent: 'center', gap: 8},
  mediaPhText: {color: '#9ca3af', fontSize: font.size.sm, fontWeight: font.weight.medium},
  mediaGreen: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: GREEN, marginTop: 12},
  mediaGreenText: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  linkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  linkMonoFlex: {flex: 1, color: '#15803d', fontSize: font.size.xs},
  copyInline: {flexDirection: 'row', alignItems: 'center', gap: 4},
  copyInlineText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  editBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0'},
  editBtnText: {color: GREEN, fontSize: font.size.xs, fontWeight: font.weight.bold},
  label: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1, marginBottom: 8},
  input: {backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#1f2937', fontSize: font.size.sm},
  hint: {color: '#9ca3af', fontSize: 10, marginTop: 6},
  previewWrap: {marginTop: 4, marginBottom: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#bbf7d0', position: 'relative'},
  previewImg: {width: '100%', height: 180},
  removeBtn: {position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3},
  picker: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 12},
  pickerText: {color: '#6b7280', fontSize: font.size.sm},
  collabNote: {flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 16},
  collabNoteText: {flex: 1, color: '#92400e', fontSize: font.size.xs, lineHeight: 17},
  errBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12},
  errText: {color: '#dc2626', fontSize: font.size.xs},
  cancelEditBtn: {alignItems: 'center', paddingVertical: 8},
  cancelEditText: {color: '#6b7280', fontSize: font.size.xs, fontWeight: font.weight.medium},
  ctaWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, backgroundColor: 'transparent'},
  ctaGreen: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4},
  ctaGreenDisabled: {backgroundColor: 'rgba(27,162,75,0.4)', shadowOpacity: 0, elevation: 0},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  ctaCountdown: {textAlign: 'center', color: '#6b7280', fontSize: font.size.xs, marginTop: 6},
});
