import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Button, TextField} from '../components/ui';
import {MultiSelect, Select} from '../components/Select';
import {DateField} from '../components/DateField';
import {useAuth} from '../context/AuthContext';
import {apiErrorMessage} from '../api/client';
import {register} from '../api/auth';
import {
  fetchCategories,
  fetchContentTypes,
  fetchCountries,
  fetchLangs,
  fetchLocalities,
  fetchOccupations,
  fetchStudies,
  Ref,
} from '../api/reference';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({navigation}: Props) {
  const {applyAuth} = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Âge minimum 16 ans (contrainte backend) → date max sélectionnable
  const maxBirthdate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d;
  }, []);

  // Données de référence
  const [countries, setCountries] = useState<Ref[]>([]);
  const [localities, setLocalities] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [contentTypes, setContentTypes] = useState<Ref[]>([]);
  const [langs, setLangs] = useState<Ref[]>([]);
  const [studies, setStudies] = useState<Ref[]>([]);
  const [occupations, setOccupations] = useState<Ref[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  // Champs
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [countryId, setCountryId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [langId, setLangId] = useState('');
  const [studyId, setStudyId] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [occupationId, setOccupationId] = useState('');
  const [vues, setVues] = useState('');
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
      } catch {
        // le formulaire reste utilisable, les listes se rechargeront au besoin
      }
    })();
  }, []);

  useEffect(() => {
    if (!countryId) return;
    setLocalityId('');
    setLocLoading(true);
    fetchLocalities(countryId)
      .then(setLocalities)
      .catch(() => setLocalities([]))
      .finally(() => setLocLoading(false));
  }, [countryId]);

  const toggle = (arr: string[], id: string, setter: (v: string[]) => void, max?: number) => {
    if (arr.includes(id)) {
      setter(arr.filter(x => x !== id));
    } else {
      if (max && arr.length >= max) return;
      setter([...arr, id]);
    }
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!firstname.trim() || !lastname.trim()) return 'Renseigne ton nom et prénom.';
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Adresse email invalide.';
      if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
      if (password !== passwordConfirm) return 'Les mots de passe ne correspondent pas.';
      if (!/^[0-9]{8,15}$/.test(phone)) return 'Numéro de téléphone invalide (8 à 15 chiffres).';
    }
    if (step === 1) {
      if (!countryId) return 'Choisis ton pays.';
      if (!localityId) return 'Choisis ta ville.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return 'Date de naissance au format AAAA-MM-JJ.';
    }
    if (step === 2) {
      if (!langId) return 'Choisis ta langue.';
      if (!studyId) return "Choisis ton niveau d'étude.";
      if (!occupationId) return 'Choisis ta profession.';
      if (cats.length < 1) return 'Sélectionne au moins une catégorie.';
      if (types.length < 1) return 'Sélectionne au moins un type de contenu.';
      const v = parseInt(vues, 10);
      if (isNaN(v) || v < 1 || v > 5000) return 'Vues moyennes entre 1 et 5000.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      Alert.alert('Vérifie tes infos', err);
      return;
    }
    if (step < 2) setStep(step + 1);
    else submit();
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
        ambassador_code: ambassadorCode.trim() || undefined,
      });

      if (res.token && res.user && res.profil) {
        await applyAuth(res.token, res.user, res.profil);
        // RootNavigator bascule automatiquement vers l'app.
      } else {
        Alert.alert('Inscription réussie', res.message ?? 'Tu peux maintenant te connecter.', [
          {text: 'OK', onPress: () => navigation.navigate('Login')},
        ]);
      }
    } catch (e) {
      Alert.alert('Inscription impossible', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step === 0 ? navigation.goBack() : setStep(step - 1))}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.back}>‹ {step === 0 ? 'Connexion' : 'Précédent'}</Text>
        </TouchableOpacity>
        <Text style={styles.stepInd}>Étape {step + 1}/3</Text>
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>Tes informations de base.</Text>
              <TextField label="Prénom" value={firstname} onChangeText={setFirstname} placeholder="Prénom" />
              <TextField label="Nom" value={lastname} onChangeText={setLastname} placeholder="Nom" />
              <TextField label="Email" value={email} onChangeText={setEmail} placeholder="ton@email.com" autoCapitalize="none" keyboardType="email-address" />
              <TextField label="Téléphone" value={phone} onChangeText={setPhone} placeholder="Ex : 97000000" keyboardType="phone-pad" />
              <TextField label="Mot de passe" value={password} onChangeText={setPassword} placeholder="8 caractères min." secureTextEntry />
              <TextField label="Confirmer le mot de passe" value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="Répète le mot de passe" secureTextEntry />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>Localisation</Text>
              <Text style={styles.subtitle}>Où diffuses-tu ?</Text>
              <Select label="Pays" options={countries} value={countryId} onChange={setCountryId} />
              <Select label="Ville" options={localities} value={localityId} onChange={setLocalityId} disabled={!countryId} loading={locLoading} />
              <DateField label="Date de naissance" value={birthdate} onChange={setBirthdate} maximumDate={maxBirthdate} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>Profil de diffusion</Text>
              <Text style={styles.subtitle}>Pour te proposer les bonnes campagnes.</Text>
              <Select label="Langue" options={langs} value={langId} onChange={setLangId} />
              <Select label="Niveau d'étude" options={studies} value={studyId} onChange={setStudyId} />
              <Select label="Profession" options={occupations} value={occupationId} onChange={setOccupationId} />
              <MultiSelect label="Catégories" options={categories} values={cats} onToggle={id => toggle(cats, id, setCats, 4)} max={4} />
              <MultiSelect label="Types de contenu" options={contentTypes} values={types} onToggle={id => toggle(types, id, setTypes)} />
              <TextField label="Vues moyennes par Status" value={vues} onChangeText={setVues} placeholder="Ex : 250" keyboardType="number-pad" />
              <TextField label="Code parrain (optionnel)" value={ambassadorCode} onChangeText={setAmbassadorCode} placeholder="Code ambassadeur" autoCapitalize="characters" />
            </>
          )}

          <Button
            title={step < 2 ? 'Continuer' : 'Créer mon compte'}
            onPress={next}
            loading={busy}
            style={{marginTop: spacing.md}}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  stepInd: {fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.medium},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text},
  subtitle: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg},
});
