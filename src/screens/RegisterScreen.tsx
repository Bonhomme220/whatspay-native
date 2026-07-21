import React, {useEffect, useMemo, useState} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';
import {colors, font, spacing} from '../theme';
import {TextField} from '../components/ui';
import {MultiSelect, Select} from '../components/Select';
import {DateField} from '../components/DateField';
import {useAuth} from '../context/AuthContext';
import {apiErrorMessage} from '../api/client';
import {register} from '../api/auth';
import {
  fetchArrondissements,
  fetchCategories,
  fetchContentTypes,
  fetchCountries,
  fetchLangs,
  fetchLocalities,
  fetchOccupations,
  fetchQuartiers,
  fetchStudies,
  Ref,
} from '../api/reference';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const GREEN = '#1ba24b';
const STEPS = ['Identité', 'Localisation', 'Profil', 'Sécurité'];

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

export default function RegisterScreen({navigation}: Props) {
  const {applyAuth} = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const maxBirthdate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d;
  }, []);

  // Données de référence
  const [countries, setCountries] = useState<Ref[]>([]);
  const [localities, setLocalities] = useState<Ref[]>([]);
  const [arrondissements, setArrondissements] = useState<Ref[]>([]);
  const [quartiers, setQuartiers] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [contentTypes, setContentTypes] = useState<Ref[]>([]);
  const [langs, setLangs] = useState<Ref[]>([]);
  const [studies, setStudies] = useState<Ref[]>([]);
  const [occupations, setOccupations] = useState<Ref[]>([]);

  // Champs
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [countryId, setCountryId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [arrId, setArrId] = useState('');
  const [quartierId, setQuartierId] = useState('');
  const [phone, setPhone] = useState('');
  const [vues, setVues] = useState('');
  const [langId, setLangId] = useState('');
  const [studyId, setStudyId] = useState('');
  const [occupationId, setOccupationId] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [ambassadorCode, setAmbassadorCode] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, cat, ct, l, s, occ] = await Promise.all([
          fetchCountries(),
          fetchCategories(),
          fetchContentTypes(),
          fetchLangs(),
          fetchStudies(),
          fetchOccupations(),
        ]);
        setCountries(c);
        setCategories(cat);
        setContentTypes(ct);
        setLangs(l);
        setStudies(s);
        setOccupations(occ);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!countryId) return;
    setLocalityId('');
    setArrId('');
    setQuartierId('');
    setArrondissements([]);
    setQuartiers([]);
    fetchLocalities(countryId).then(setLocalities).catch(() => setLocalities([]));
  }, [countryId]);

  useEffect(() => {
    if (!localityId) return;
    setArrId('');
    setQuartierId('');
    setQuartiers([]);
    fetchArrondissements(localityId).then(setArrondissements).catch(() => setArrondissements([]));
  }, [localityId]);

  useEffect(() => {
    if (!arrId) return;
    setQuartierId('');
    fetchQuartiers(arrId).then(setQuartiers).catch(() => setQuartiers([]));
  }, [arrId]);

  const toggle = (arr: string[], id: string, setter: (v: string[]) => void, max?: number) => {
    if (arr.includes(id)) setter(arr.filter(x => x !== id));
    else if (!max || arr.length < max) setter([...arr, id]);
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!firstname.trim() || !lastname.trim()) return 'Renseigne ton nom et prénom.';
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Adresse email invalide.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return 'Choisis ta date de naissance.';
    }
    if (step === 1) {
      if (!countryId) return 'Choisis ton pays.';
      if (!localityId) return 'Choisis ta ville.';
      if (arrondissements.length && !arrId) return 'Choisis ton arrondissement.';
      if (quartiers.length && !quartierId) return 'Choisis ton quartier.';
      if (!/^[0-9]{8,15}$/.test(phone)) return 'Numéro de téléphone invalide (8 à 15 chiffres).';
    }
    if (step === 2) {
      const v = parseInt(vues, 10);
      if (isNaN(v) || v < 1 || v > 5000) return 'Vues moyennes entre 1 et 5000.';
      if (!langId) return 'Choisis ta langue.';
      if (!studyId) return "Choisis ton niveau d'études.";
      if (!occupationId) return 'Choisis ta profession.';
      if (cats.length < 1) return 'Sélectionne au moins une catégorie.';
      if (types.length < 1) return 'Sélectionne au moins un type de contenu.';
    }
    if (step === 3) {
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
    if (step < 3) setStep(step + 1);
    else submit();
  };

  const back = () => {
    setError(null);
    setStep(s => Math.max(0, s - 1));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await register({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm,
        phone,
        phonecountry_id: countryId,
        country_id: countryId,
        locality_id: localityId,
        birthdate,
        vuesmoyen: parseInt(vues, 10),
        lang_id: langId,
        study_id: studyId,
        categories: cats,
        contentTypes: types,
        occupation_id: occupationId || undefined,
        arrondissement_locality_id: arrId || undefined,
        quartier_locality_id: quartierId || undefined,
        ambassador_code: ambassadorCode.trim() || undefined,
      });
      if (res.token && res.user && res.profil) {
        await applyAuth(res.token, res.user, res.profil);
      } else {
        Alert.alert('Inscription réussie', res.message ?? 'Tu peux maintenant te connecter.', [
          {text: 'OK', onPress: () => navigation.navigate('Login')},
        ]);
      }
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
                  <Text style={styles.introText}>📱 Inscription diffuseur — monétise tes Status WhatsApp</Text>
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
                  <DateField label="Date de naissance" value={birthdate} onChange={setBirthdate} maximumDate={maxBirthdate} />
                </>
              )}

              {/* Étape 1 : Localisation */}
              {step === 1 && (
                <>
                  <Select label="Pays" options={countries} value={countryId} onChange={setCountryId} placeholder="Sélectionnez votre pays" />
                  <Select label="Ville / Localité" options={localities} value={localityId} onChange={setLocalityId} disabled={!countryId} placeholder="Sélectionnez votre ville" />
                  <Select label="Arrondissement" options={arrondissements} value={arrId} onChange={setArrId} disabled={!arrondissements.length} placeholder="Sélectionnez votre arrondissement" />
                  <Select label="Quartier" options={quartiers} value={quartierId} onChange={setQuartierId} disabled={!quartiers.length} placeholder="Sélectionnez votre quartier" />
                  <TextField label="Numéro de téléphone" value={phone} onChangeText={setPhone} placeholder="97000000" keyboardType="phone-pad" />
                </>
              )}

              {/* Étape 2 : Profil */}
              {step === 2 && (
                <>
                  <TextField label="Vues moyennes par statut WhatsApp" value={vues} onChangeText={setVues} placeholder="Ex : 500" keyboardType="number-pad" />
                  <Select label="Langue de diffusion" options={langs} value={langId} onChange={setLangId} placeholder="Sélectionnez une langue" />
                  <Select label="Niveau d'études" options={studies} value={studyId} onChange={setStudyId} placeholder="Sélectionnez votre niveau" />
                  <Select label="Profession" options={occupations} value={occupationId} onChange={setOccupationId} placeholder="Sélectionnez votre profession" />
                  <MultiSelect label="Catégories WhatsApp" options={categories} values={cats} onToggle={id => toggle(cats, id, setCats, 4)} max={4} />
                  <MultiSelect label="Types de contenu" options={contentTypes} values={types} onToggle={id => toggle(types, id, setTypes)} />
                </>
              )}

              {/* Étape 3 : Sécurité */}
              {step === 3 && (
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

                  <TextField label="Code ambassadeur (facultatif)" value={ambassadorCode} onChangeText={t => setAmbassadorCode(t.toUpperCase())} placeholder="Ex : WTP-ABC123" autoCapitalize="characters" />
                  <Text style={styles.hint}>Un ambassadeur t'a invité ? Entre son code. Sinon laisse vide.</Text>
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
                    <Text style={styles.btnNextText}>{step < 3 ? 'Suivant' : "S'inscrire"}</Text>
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
  hint: {color: '#9ca3af', fontSize: font.size.xs, fontStyle: 'italic', marginTop: 6, lineHeight: 16},
  nav: {flexDirection: 'row', gap: 12, marginTop: 8},
  btnBack: {flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'},
  btnBackText: {color: '#6b7280', fontSize: font.size.md, fontWeight: font.weight.bold},
  btnNext: {flex: 1, backgroundColor: GREEN, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  btnNextText: {color: '#fff', fontSize: font.size.md, fontWeight: font.weight.bold},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: 18},
  footerText: {color: '#6b7280', fontSize: font.size.sm},
  footerLink: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
});
