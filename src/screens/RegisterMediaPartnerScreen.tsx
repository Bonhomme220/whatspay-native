import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';
import {colors, font, spacing} from '../theme';
import {TextField} from '../components/ui';
import {Select} from '../components/Select';
import {apiErrorMessage} from '../api/client';
import {
  MediaPartnerAccountType,
  MediaPartnerImage,
  MediaPartnerPublishFrequency,
  registerMediaPartner,
} from '../api/auth';
import {
  fetchChannelCategories,
  fetchCountries,
  fetchLangs,
  fetchPaymentMethods,
  PaymentMethodRef,
  Ref,
} from '../api/reference';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterMediaPartner'>;

const GREEN = '#1ba24b';
const STEPS = ['Identité', 'Chaîne', 'Couverture', 'Justificatifs', 'Sécurité'];

const ACCOUNT_TYPES: Ref[] = [
  {id: 'personne', name: 'Personne / Influenceur'},
  {id: 'media', name: 'Média'},
  {id: 'marque', name: 'Marque / Entreprise'},
  {id: 'communaute', name: 'Communauté / Association'},
  {id: 'institution_religieuse', name: 'Institution religieuse'},
];

const PUBLISH_FREQUENCIES: Ref[] = [
  {id: '1x', name: '1 fois/jour'},
  {id: '2x', name: '2 fois/jour'},
  {id: '3x', name: '3 fois/jour'},
  {id: '5x_plus', name: '5 fois ou plus/jour'},
];

interface CoverageRow {
  countryId: string;
  percentage: string;
}

function StepDots({step}: {step: number}) {
  return (
    <View style={styles.dots}>
      {STEPS.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < step ? styles.dotDone : i === step ? styles.dotCurrent : styles.dotTodo,
          ]}
        />
      ))}
    </View>
  );
}

function ImageUploadField({
  label,
  image,
  onPick,
  onRemove,
}: {
  label: string;
  image: MediaPartnerImage | null;
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
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.picker} onPress={onPick} activeOpacity={0.8}>
          <Text style={styles.pickerText}>Ajouter une capture</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RegisterMediaPartnerScreen({navigation}: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  // Données de référence
  const [countries, setCountries] = useState<Ref[]>([]);
  const [langs, setLangs] = useState<Ref[]>([]);
  const [channelCategories, setChannelCategories] = useState<Ref[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRef[]>([]);

  // Étape 0 : Identité
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryId, setPhoneCountryId] = useState('');
  const [countryId, setCountryId] = useState('');

  // Étape 1 : Chaîne
  const [channelName, setChannelName] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [accountType, setAccountType] = useState('');
  const [channelCategoryId, setChannelCategoryId] = useState('');
  const [channelCategorySecondaryId, setChannelCategorySecondaryId] = useState('');
  const [langId, setLangId] = useState('');
  const [publishFrequency, setPublishFrequency] = useState('');
  const [followersCount, setFollowersCount] = useState('');
  const [reachedAccounts, setReachedAccounts] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  // Étape 2 : Couverture pays
  const [coverage, setCoverage] = useState<CoverageRow[]>([{countryId: '', percentage: ''}]);

  // Étape 3 : Justificatifs
  const [screenshotChannelPage, setScreenshotChannelPage] = useState<MediaPartnerImage | null>(null);
  const [screenshotCouverture, setScreenshotCouverture] = useState<MediaPartnerImage | null>(null);
  const [screenshotFollowers, setScreenshotFollowers] = useState<MediaPartnerImage | null>(null);

  // Étape 4 : Sécurité
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, l, cc, pm] = await Promise.all([
          fetchCountries(),
          fetchLangs(),
          fetchChannelCategories(),
          fetchPaymentMethods(),
        ]);
        setCountries(c);
        setLangs(l);
        setChannelCategories(cc);
        setPaymentMethods(pm);
      } catch {}
    })();
  }, []);

  const addCoverageRow = () => setCoverage(rows => [...rows, {countryId: '', percentage: ''}]);
  const removeCoverageRow = (i: number) => setCoverage(rows => rows.filter((_, idx) => idx !== i));
  const updateCoverageRow = (i: number, patch: Partial<CoverageRow>) =>
    setCoverage(rows => rows.map((r, idx) => (idx === i ? {...r, ...patch} : r)));

  const pickImage = (setter: (img: MediaPartnerImage) => void) => {
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

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!firstname.trim() || !lastname.trim()) return 'Renseigne ton nom et prénom.';
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Adresse email invalide.';
      if (!/^[0-9]{8,15}$/.test(phone)) return 'Numéro de téléphone invalide (8 à 15 chiffres).';
      if (!phoneCountryId) return 'Choisis l\'indicatif du pays de ton téléphone.';
      if (!countryId) return 'Choisis ton pays de résidence.';
    }
    if (step === 1) {
      if (!channelName.trim()) return 'Renseigne le nom de ta chaîne.';
      if (!/^https?:\/\/\S+/.test(channelLink.trim())) return 'Lien de la chaîne invalide (doit commencer par http:// ou https://).';
      if (!accountType) return 'Choisis le type de compte.';
      if (!channelCategoryId) return 'Choisis la catégorie principale de ta chaîne.';
      if (!langId) return 'Choisis la langue de diffusion.';
      if (!publishFrequency) return 'Choisis la fréquence de publication.';
      const followers = parseInt(followersCount, 10);
      if (isNaN(followers) || followers < 0) return 'Nombre de followers invalide.';
      const reached = parseInt(reachedAccounts, 10);
      if (isNaN(reached)) return 'Renseigne le nombre de comptes touchés sur 30 jours.';
      if (reached < 100) return 'Il faut au moins 100 comptes touchés sur 30 jours pour être éligible.';
      if (!paymentMethodId) return 'Choisis un moyen de paiement.';
    }
    if (step === 2) {
      const valid = coverage.filter(r => r.countryId && r.percentage.trim());
      if (valid.length < 1) return 'Ajoute au moins un pays de couverture avec son pourcentage.';
      for (const r of valid) {
        const p = parseInt(r.percentage, 10);
        if (isNaN(p) || p < 1 || p > 100) return 'Pourcentage invalide (entre 1 et 100).';
      }
    }
    if (step === 3) {
      if (!screenshotChannelPage) return 'Ajoute la capture de la page de ta chaîne.';
      if (!screenshotCouverture) return "Ajoute la capture de l'onglet Couverture.";
      if (!screenshotFollowers) return "Ajoute la capture de l'onglet Followers.";
    }
    if (step === 4) {
      if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password))
        return 'Mot de passe : 8 caractères min, une majuscule, un chiffre et un caractère spécial.';
      if (password !== passwordConfirm) return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  const back = () => {
    setError(null);
    setStep(s => Math.max(0, s - 1));
  };

  const submit = async () => {
    if (!screenshotChannelPage || !screenshotCouverture || !screenshotFollowers) return;
    setBusy(true);
    try {
      const res = await registerMediaPartner({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm,
        phone,
        phonecountry_id: phoneCountryId,
        country_id: countryId,
        channel_name: channelName.trim(),
        channel_link: channelLink.trim(),
        account_type: accountType as MediaPartnerAccountType,
        channel_category_id: channelCategoryId,
        channel_category_secondary_id: channelCategorySecondaryId || undefined,
        lang_id: langId,
        publish_frequency: publishFrequency as MediaPartnerPublishFrequency,
        followers_count: parseInt(followersCount, 10),
        reached_accounts_30d: parseInt(reachedAccounts, 10),
        payment_method_id: paymentMethodId,
        country_coverage: coverage
          .filter(r => r.countryId && r.percentage.trim())
          .map(r => ({country_id: r.countryId, percentage: parseInt(r.percentage, 10)})),
        screenshot_channel_page: screenshotChannelPage,
        screenshot_couverture: screenshotCouverture,
        screenshot_followers: screenshotFollowers,
      });
      Alert.alert(
        'Inscription réussie',
        res.message ?? 'Inscription réussie. Votre profil de chaîne est en attente de validation par notre équipe.',
        [{text: 'OK', onPress: () => navigation.navigate('Login')}],
      );
    } catch (e) {
      setError(apiErrorMessage(e, 'Inscription impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/login-bg.jpg')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />

              {step === 0 && (
                <View style={styles.intro}>
                  <Text style={styles.introText}>📢 Inscription Partenaire Média — chaîne WhatsApp</Text>
                </View>
              )}

              <StepDots step={step} />
              <Text style={styles.title}>Étape {step + 1} — {STEPS[step]}</Text>

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Étape 0 : Identité */}
              {step === 0 && (
                <>
                  <View style={styles.rowGap}>
                    <View style={{flex: 1}}>
                      <TextField label="Prénom" value={firstname} onChangeText={setFirstname} placeholder="Jean" />
                    </View>
                    <View style={{flex: 1}}>
                      <TextField label="Nom" value={lastname} onChangeText={setLastname} placeholder="Dupont" />
                    </View>
                  </View>
                  <TextField label="Adresse mail" value={email} onChangeText={setEmail} placeholder="votre@mail.com" autoCapitalize="none" keyboardType="email-address" />
                  <Select label="Indicatif du téléphone" options={countries} value={phoneCountryId} onChange={setPhoneCountryId} placeholder="Sélectionnez le pays de votre numéro" />
                  <TextField label="Numéro de téléphone" value={phone} onChangeText={setPhone} placeholder="97000000" keyboardType="phone-pad" />
                  <Select label="Pays de résidence" options={countries} value={countryId} onChange={setCountryId} placeholder="Sélectionnez votre pays" />
                </>
              )}

              {/* Étape 1 : Chaîne */}
              {step === 1 && (
                <>
                  <TextField label="Nom de la chaîne" value={channelName} onChangeText={setChannelName} placeholder="Ex : Actu Bénin" />
                  <TextField label="Lien de la chaîne" value={channelLink} onChangeText={setChannelLink} placeholder="https://whatsapp.com/channel/..." autoCapitalize="none" keyboardType="url" />
                  <Select label="Type de compte" options={ACCOUNT_TYPES} value={accountType} onChange={setAccountType} placeholder="Sélectionnez un type de compte" />
                  <Select label="Catégorie principale" options={channelCategories} value={channelCategoryId} onChange={setChannelCategoryId} placeholder="Sélectionnez une catégorie" />
                  <Select label="Catégorie secondaire (facultatif)" options={channelCategories} value={channelCategorySecondaryId} onChange={setChannelCategorySecondaryId} placeholder="Sélectionnez une catégorie" />
                  <Select label="Langue de diffusion" options={langs} value={langId} onChange={setLangId} placeholder="Sélectionnez une langue" />
                  <Select label="Fréquence de publication" options={PUBLISH_FREQUENCIES} value={publishFrequency} onChange={setPublishFrequency} placeholder="Sélectionnez une fréquence" />
                  <TextField label="Nombre de followers" value={followersCount} onChangeText={setFollowersCount} placeholder="Ex : 5000" keyboardType="number-pad" />
                  <TextField
                    label="Comptes touchés sur les 30 derniers jours (onglet Couverture)"
                    value={reachedAccounts}
                    onChangeText={setReachedAccounts}
                    placeholder="Ex : 1200"
                    keyboardType="number-pad"
                  />
                  {!!reachedAccounts && parseInt(reachedAccounts, 10) < 100 && (
                    <Text style={[styles.hint, {color: colors.danger}]}>
                      Il faut au moins 100 comptes touchés sur 30 jours pour être éligible.
                    </Text>
                  )}
                  <Select label="Moyen de paiement" options={paymentMethods} value={paymentMethodId} onChange={setPaymentMethodId} placeholder="Sélectionnez un moyen de paiement" />
                </>
              )}

              {/* Étape 2 : Couverture pays */}
              {step === 2 && (
                <>
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
                </>
              )}

              {/* Étape 3 : Justificatifs */}
              {step === 3 && (
                <>
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
                </>
              )}

              {/* Étape 4 : Sécurité */}
              {step === 4 && (
                <>
                  <Text style={styles.label}>Mot de passe</Text>
                  <View style={styles.pwdWrap}>
                    <TextInput
                      style={[styles.input, {paddingRight: 44}]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Minimum 8 caractères"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPwd}
                    />
                    <TouchableOpacity style={styles.eye} onPress={() => setShowPwd(v => !v)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                      <Text style={styles.eyeIcon}>{showPwd ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hint}>Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial. Ex : MonMot2024!</Text>

                  <Text style={[styles.label, {marginTop: 14}]}>Confirmer le mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    placeholder="Répétez le mot de passe"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPwd}
                  />
                </>
              )}

              {/* Navigation */}
              <View style={styles.nav}>
                {step > 0 && (
                  <TouchableOpacity style={styles.btnBack} onPress={back}>
                    <Text style={styles.btnBackText}>Retour</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.btnNext, busy && {opacity: 0.6}]} onPress={next} disabled={busy} activeOpacity={0.85}>
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnNextText}>{step < STEPS.length - 1 ? 'Suivant' : "S'inscrire"}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Déjà inscrit ? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {flex: 1},
  safe: {flex: 1},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: spacing.lg},
  card: {width: '100%', maxWidth: 400, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 28, shadowColor: '#081542', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: {width: 0, height: 8}, elevation: 4},
  logo: {width: 150, height: 48, alignSelf: 'center', marginBottom: 16},
  intro: {backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16},
  introText: {color: colors.primaryDark, fontSize: font.size.xs, textAlign: 'center'},
  dots: {flexDirection: 'row', gap: 6, marginBottom: 14},
  dot: {height: 6, borderRadius: 3},
  dotDone: {width: 24, backgroundColor: '#16a34a'},
  dotCurrent: {width: 24, backgroundColor: '#4ade80'},
  dotTodo: {width: 12, backgroundColor: '#e5e7eb'},
  title: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold, marginBottom: 14},
  errorBox: {marginBottom: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2', paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
  errorText: {color: '#dc2626', fontSize: font.size.sm},
  rowGap: {flexDirection: 'row', gap: 12},
  label: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.medium, marginBottom: 6},
  input: {backgroundColor: colors.inputBg, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, fontSize: font.size.sm, color: '#1f2937'},
  pwdWrap: {position: 'relative', justifyContent: 'center'},
  eye: {position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center'},
  eyeIcon: {fontSize: 18},
  hint: {color: '#9ca3af', fontSize: font.size.xs, fontStyle: 'italic', marginTop: 6, marginBottom: 10, lineHeight: 16},
  coverageRow: {flexDirection: 'row', alignItems: 'flex-start'},
  removeRowBtn: {width: 32, height: 50, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs},
  removeRowText: {color: colors.danger, fontSize: font.size.md, fontWeight: font.weight.bold},
  addRowBtn: {alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: spacing.sm},
  addRowText: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
  previewWrap: {borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#bbf7d0', position: 'relative'},
  previewImg: {width: '100%', height: 160},
  removeBtn: {position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3},
  removeBtnText: {color: '#4b5563', fontSize: font.size.sm, fontWeight: font.weight.bold},
  picker: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 12},
  pickerText: {color: '#6b7280', fontSize: font.size.sm},
  nav: {flexDirection: 'row', gap: 12, marginTop: 8},
  btnBack: {flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'},
  btnBackText: {color: '#6b7280', fontSize: font.size.md, fontWeight: font.weight.bold},
  btnNext: {flex: 1, backgroundColor: GREEN, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  btnNextText: {color: '#fff', fontSize: font.size.md, fontWeight: font.weight.bold},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: 18},
  footerText: {color: '#6b7280', fontSize: font.size.sm},
  footerLink: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
});
