import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {MediaPartnerStackParamList} from '../navigation/MediaPartnerNavigator';
import {
  fetchMediaPartnerProfile,
  MediaPartnerProfile,
  MediaPartnerRecaptureImage,
  submitMediaPartnerRecapture,
} from '../api/mediaPartnerProfile';
import {fetchCountries, Ref} from '../api/reference';
import {apiErrorMessage} from '../api/client';
import {TextField} from '../components/ui';
import {Select} from '../components/Select';
import Icon from '../components/Icon';
import {font, spacing} from '../theme';

type Props = NativeStackScreenProps<MediaPartnerStackParamList, 'MediaPartnerRecapture'>;

const GREEN = '#1ba24b';

interface CoverageRow {
  countryId: string;
  percentage: string;
}

const STATUS_INFO: Record<string, {label: string; bg: string; fg: string}> = {
  actif: {label: 'Actif', bg: '#dcfce7', fg: '#15803d'},
  inactif: {label: 'Inactif', bg: '#ffedd5', fg: '#c2410c'},
  off: {label: 'Désactivé', bg: '#fee2e2', fg: '#b91c1c'},
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

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

/** Capture d'écran justificative — reprend le composant/pattern de RegisterMediaPartnerScreen. */
function ImageUploadField({
  label,
  image,
  onPick,
  onRemove,
}: {
  label: string;
  image: MediaPartnerRecaptureImage | null;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={{marginBottom: spacing.md}}>
      <Text style={styles.label}>{label} *</Text>
      {image ? (
        <View style={styles.previewWrap}>
          <Image source={{uri: image.uri}} style={styles.previewImg} resizeMode="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Icon name="close" size={16} color="#4b5563" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.picker} onPress={onPick} activeOpacity={0.8}>
          <Icon name="image-outline" size={20} color="#6b7280" />
          <Text style={styles.pickerText}>Ajouter une capture</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MediaPartnerRecaptureScreen({navigation}: Props) {
  const [profile, setProfile] = useState<MediaPartnerProfile | null>(null);
  const [countries, setCountries] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Formulaire de soumission (pré-rempli une seule fois avec les chiffres actuels du profil).
  const [followers, setFollowers] = useState('');
  const [reachedAccounts, setReachedAccounts] = useState('');
  const [coverage, setCoverage] = useState<CoverageRow[]>([{countryId: '', percentage: ''}]);
  const [screenshotChannelPage, setScreenshotChannelPage] = useState<MediaPartnerRecaptureImage | null>(null);
  const [screenshotCouverture, setScreenshotCouverture] = useState<MediaPartnerRecaptureImage | null>(null);
  const [screenshotFollowers, setScreenshotFollowers] = useState<MediaPartnerRecaptureImage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [p, c] = await Promise.all([fetchMediaPartnerProfile(), fetchCountries()]);
      setProfile(p);
      setCountries(c);
      // Ne pré-remplit qu'une fois : on ne veut pas écraser une saisie en cours si l'écran
      // reprend le focus (ex. retour depuis le sélecteur de pays).
      setPrefilled(prev => {
        if (!prev) {
          setFollowers(p.followers_count != null ? String(p.followers_count) : '');
          setReachedAccounts(p.reached_accounts_30d != null ? String(p.reached_accounts_30d) : '');
          if (p.country_coverage && p.country_coverage.length > 0) {
            setCoverage(
              p.country_coverage.map(row => ({countryId: row.country_id, percentage: String(row.percentage)})),
            );
          }
        }
        return true;
      });
    } catch (e) {
      setLoadError(apiErrorMessage(e, 'Impossible de charger votre profil.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addCoverageRow = () => setCoverage(rows => [...rows, {countryId: '', percentage: ''}]);
  const removeCoverageRow = (i: number) => setCoverage(rows => rows.filter((_, idx) => idx !== i));
  const updateCoverageRow = (i: number, patch: Partial<CoverageRow>) =>
    setCoverage(rows => rows.map((r, idx) => (idx === i ? {...r, ...patch} : r)));

  const pickImage = (setter: (img: MediaPartnerRecaptureImage) => void) => {
    Alert.alert('Ajouter une capture', 'Choisissez une source', [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const res = await launchCamera({mediaType: 'photo', quality: 0.8});
          if (res.didCancel) return;
          const a = res.assets?.[0];
          if (a?.uri) setter({uri: a.uri, type: a.type, fileName: a.fileName ?? undefined});
        },
      },
      {
        text: 'Choisir depuis la galerie',
        onPress: async () => {
          const res = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
          if (res.didCancel) return;
          const a = res.assets?.[0];
          if (a?.uri) setter({uri: a.uri, type: a.type, fileName: a.fileName ?? undefined});
        },
      },
      {text: 'Annuler', style: 'cancel'},
    ]);
  };

  const validate = (): string | null => {
    const f = parseInt(followers, 10);
    if (isNaN(f) || f < 0) return 'Nombre de followers invalide.';
    const r = parseInt(reachedAccounts, 10);
    if (isNaN(r) || r < 0) return 'Renseigne le nombre de comptes touchés sur 30 jours.';
    const valid = coverage.filter(row => row.countryId && row.percentage.trim());
    if (valid.length < 1) return 'Ajoute au moins un pays de couverture avec son pourcentage.';
    for (const row of valid) {
      const p = parseInt(row.percentage, 10);
      if (isNaN(p) || p < 1 || p > 100) return 'Pourcentage invalide (entre 1 et 100).';
    }
    if (!screenshotChannelPage) return 'Ajoute la capture de la page de ta chaîne.';
    if (!screenshotCouverture) return "Ajoute la capture de l'onglet Couverture.";
    if (!screenshotFollowers) return "Ajoute la capture de l'onglet Followers.";
    return null;
  };

  const submit = async () => {
    setFormError(null);
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    if (!screenshotChannelPage || !screenshotCouverture || !screenshotFollowers) return;
    setSubmitting(true);
    try {
      const res = await submitMediaPartnerRecapture({
        followers: parseInt(followers, 10),
        reachedAccounts30d: parseInt(reachedAccounts, 10),
        countryCoverage: coverage
          .filter(row => row.countryId && row.percentage.trim())
          .map(row => ({country_id: row.countryId, percentage: parseInt(row.percentage, 10)})),
        screenshotChannelPage,
        screenshotCouverture,
        screenshotFollowers,
      });
      Alert.alert('Recapture soumise', res.message ?? 'Recapture soumise. Elle sera examinée par notre équipe.');
      await load();
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text style={{color: '#6b7280'}}>{loadError ?? 'Profil introuvable.'}</Text>
        <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
          <Text style={{color: GREEN, marginTop: 8}}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = STATUS_INFO[profile.status] ?? {label: profile.status, bg: '#f3f4f6', fg: '#4b5563'};
  const recapture = profile.current_month_recapture;
  const isPending = recapture?.status === 'pending';
  const isApproved = recapture?.status === 'approved';
  const isRejected = recapture?.status === 'rejected';
  const showForm = !isPending && !isApproved;
  const isRestricted = profile.status === 'inactif' || profile.status === 'off';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{paddingBottom: showForm ? 110 : 24}}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Icon name="chevron-back" size={20} color="#fff" />
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
            <View style={[styles.pill, {backgroundColor: statusInfo.bg}]}>
              <Text style={[styles.pillText, {color: statusInfo.fg}]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Recapture mensuelle</Text>
          <Text style={styles.heroSub}>{profile.channel_name}</Text>
        </View>

        <View style={styles.body}>
          {isRestricted && (
            <View style={styles.warnBox}>
              <Icon name="alert-circle-outline" size={16} color="#92400e" />
              <Text style={styles.warnText}>
                Votre compte est {statusInfo.label.toLowerCase()} faute de recapture (aucune nouvelle mission
                tant qu'il l'est). Il redevient actif automatiquement dès qu'une recapture est validée — aucune
                démarche supplémentaire de votre part n'est nécessaire.
              </Text>
            </View>
          )}

          {isPending && (
            <Card title="RECAPTURE EN ATTENTE DE VALIDATION" icon="time-outline">
              <Text style={styles.readonlyText}>
                Votre recapture du mois a été soumise le {fmtDate(recapture?.submitted_at)}. Elle est en attente
                de validation par notre équipe.
              </Text>
            </Card>
          )}

          {isApproved && (
            <Card title="RECAPTURE DÉJÀ VALIDÉE CE MOIS-CI" icon="checkmark-circle-outline">
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Followers</Text>
                <Text style={styles.infoValue}>{profile.followers_count.toLocaleString('fr-FR')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Comptes touchés (30j)</Text>
                <Text style={styles.infoValue}>{profile.reached_accounts_30d.toLocaleString('fr-FR')}</Text>
              </View>
              <View style={[styles.infoRow, {borderBottomWidth: 0, marginBottom: 0}]}>
                <Text style={styles.infoLabel}>Palier</Text>
                <Text style={styles.infoValue}>{profile.current_tier?.label ?? '—'}</Text>
              </View>
            </Card>
          )}

          {showForm && (
            <>
              {isRejected && !!recapture?.rejection_reason && (
                <View style={styles.rejBox}>
                  <Text style={styles.rejTitle}>Recapture rejetée</Text>
                  <Text style={styles.rejDesc}>{recapture.rejection_reason}</Text>
                  <Text style={[styles.rejDesc, {marginTop: 4}]}>Corrigez et soumettez à nouveau ci-dessous.</Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Icon name="information-circle-outline" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>
                  {profile.recapture_window_open
                    ? 'La fenêtre de soumission du mois (du 5 au 10) est ouverte.'
                    : "La fenêtre habituelle (du 5 au 10 du mois) est fermée, mais vous pouvez soumettre votre recapture dès maintenant."}
                </Text>
              </View>

              <Card title="VOS CHIFFRES ACTUELS" icon="stats-chart-outline">
                <TextField
                  label="Nombre de followers"
                  value={followers}
                  onChangeText={setFollowers}
                  placeholder="Ex : 5000"
                  keyboardType="number-pad"
                />
                <TextField
                  label="Comptes touchés sur les 30 derniers jours (onglet Couverture)"
                  value={reachedAccounts}
                  onChangeText={setReachedAccounts}
                  placeholder="Ex : 1200"
                  keyboardType="number-pad"
                />
              </Card>

              <Card title="COUVERTURE PAYS" icon="earth-outline">
                <Text style={styles.hint}>Indique les pays où se trouve ton audience et leur part approximative (%).</Text>
                {coverage.map((row, i) => (
                  <View key={i} style={styles.coverageRow}>
                    <View style={{flex: 2}}>
                      <Select
                        label={i === 0 ? 'Pays' : undefined}
                        options={countries}
                        value={row.countryId}
                        onChange={v => updateCoverageRow(i, {countryId: v})}
                        placeholder="Pays"
                      />
                    </View>
                    <View style={{flex: 1, marginLeft: spacing.sm}}>
                      <TextField
                        label={i === 0 ? '%' : undefined}
                        value={row.percentage}
                        onChangeText={v => updateCoverageRow(i, {percentage: v})}
                        placeholder="60"
                        keyboardType="number-pad"
                      />
                    </View>
                    {coverage.length > 1 && (
                      <TouchableOpacity
                        style={[styles.removeRowBtn, i === 0 && {marginTop: 24}]}
                        onPress={() => removeCoverageRow(i)}>
                        <Text style={styles.removeRowText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addRowBtn} onPress={addCoverageRow}>
                  <Text style={styles.addRowText}>+ Ajouter un pays</Text>
                </TouchableOpacity>
              </Card>

              <Card title="JUSTIFICATIFS" icon="camera-outline">
                <Text style={styles.hint}>Captures d'écran claires et complètes, prises depuis WhatsApp.</Text>
                <ImageUploadField
                  label="Capture de la page de votre chaîne"
                  image={screenshotChannelPage}
                  onPick={() => pickImage(setScreenshotChannelPage)}
                  onRemove={() => setScreenshotChannelPage(null)}
                />
                <ImageUploadField
                  label="Capture de l'onglet Couverture"
                  image={screenshotCouverture}
                  onPick={() => pickImage(setScreenshotCouverture)}
                  onRemove={() => setScreenshotCouverture(null)}
                />
                <ImageUploadField
                  label="Capture de l'onglet Followers"
                  image={screenshotFollowers}
                  onPick={() => pickImage(setScreenshotFollowers)}
                  onRemove={() => setScreenshotFollowers(null)}
                />
              </Card>

              {!!formError && (
                <View style={styles.errBox}>
                  <Text style={styles.errText}>{formError}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* CTA fixe */}
      {showForm && (
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaGreen} onPress={submit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Soumettre ma recapture</Text>}
          </TouchableOpacity>
        </View>
      )}
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
  body: {paddingHorizontal: 16, marginTop: -8, gap: 16, paddingTop: 8},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12},
  cardTitle: {color: '#6b7280', fontSize: 10, fontWeight: font.weight.bold, letterSpacing: 1},
  warnBox: {flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  warnText: {flex: 1, color: '#92400e', fontSize: font.size.xs, lineHeight: 17},
  readonlyText: {color: '#374151', fontSize: font.size.sm, lineHeight: 20},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 10},
  infoLabel: {color: '#6b7280', fontSize: font.size.xs},
  infoValue: {color: '#1f2937', fontSize: font.size.xs, fontWeight: font.weight.medium, textAlign: 'right', flexShrink: 1},
  rejBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  rejTitle: {color: '#b91c1c', fontSize: font.size.xs, fontWeight: font.weight.bold},
  rejDesc: {color: '#dc2626', fontSize: font.size.xs, marginTop: 4, lineHeight: 17},
  infoBox: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8},
  infoText: {flex: 1, color: '#1d4ed8', fontSize: font.size.xs},
  label: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.medium, marginBottom: 6},
  hint: {color: '#9ca3af', fontSize: font.size.xs, fontStyle: 'italic', marginTop: 2, marginBottom: 10, lineHeight: 16},
  coverageRow: {flexDirection: 'row', alignItems: 'flex-start'},
  removeRowBtn: {width: 32, height: 50, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs},
  removeRowText: {color: '#dc2626', fontSize: font.size.md, fontWeight: font.weight.bold},
  addRowBtn: {alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4},
  addRowText: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
  previewWrap: {borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#bbf7d0', position: 'relative'},
  previewImg: {width: '100%', height: 160},
  removeBtn: {position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3},
  picker: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 12},
  pickerText: {color: '#6b7280', fontSize: font.size.sm},
  errBox: {backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10},
  errText: {color: '#dc2626', fontSize: font.size.xs},
  ctaWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, backgroundColor: 'transparent'},
  ctaGreen: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
