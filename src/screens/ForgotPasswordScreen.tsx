import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, TextField} from '../components/ui';
import {Select} from '../components/Select';
import {DateField} from '../components/DateField';
import {colors, font, spacing} from '../theme';
import {apiErrorMessage} from '../api/client';
import {verifyResetIdentity} from '../api/auth';
import {fetchCountriesWithCode, type CountryRef} from '../api/reference';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const today = new Date();
const onlyDigits = (s: string) => s.replace(/\D/g, '');

export default function ForgotPasswordScreen({navigation}: Props) {
  const [countries, setCountries] = useState<CountryRef[]>([]);
  const [countryId, setCountryId] = useState('');
  const [local, setLocal] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCountriesWithCode()
      .then(list => {
        setCountries(list);
        const benin = list.find(c => onlyDigits(c.phone_code ?? '') === '229');
        setCountryId(benin?.id ?? list[0]?.id ?? '');
      })
      .catch(() => {});
  }, []);

  const country = useMemo(() => countries.find(c => c.id === countryId), [countries, countryId]);
  const code = onlyDigits(country?.phone_code ?? '');
  const isBenin = code === '229';
  const prefix = code ? `+${code}${isBenin ? ' 01' : ''}` : '';

  const submit = async () => {
    setError(null);
    if (!onlyDigits(local)) {
      setError('Renseigne ton numéro de téléphone.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      setError('Renseigne ta date de naissance.');
      return;
    }
    setLoading(true);
    try {
      // Numéro complet : indicatif + (01 pour le Bénin) + saisie.
      const phone = `${code}${isBenin ? '01' : ''}${onlyDigits(local)}`;
      const data = await verifyResetIdentity(phone, birthdate);
      navigation.navigate('ResetPassword', {token: data.token, name: data.firstname});
    } catch (e) {
      setError(apiErrorMessage(e, 'Les informations fournies ne correspondent à aucun compte.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Confirme ton identité pour réinitialiser ton mot de passe. Renseigne ton numéro de téléphone
          et ta date de naissance, exactement comme lors de ton inscription.
        </Text>

        <Select
          label="Pays"
          options={countries}
          value={countryId}
          onChange={setCountryId}
          placeholder="Sélectionne ton pays"
        />

        <View style={styles.phoneRow}>
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>{prefix || '+—'}</Text>
          </View>
          <View style={styles.phoneField}>
            <TextField
              label="Numéro de téléphone"
              value={local}
              onChangeText={setLocal}
              placeholder={isBenin ? '96 17 13 00' : 'numéro'}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        </View>

        <DateField label="Date de naissance" value={birthdate} onChange={setBirthdate} maximumDate={today} />

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button title="Vérifier mon identité" onPress={submit} loading={loading} style={{marginTop: spacing.sm}} />
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Retour à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text},
  subtitle: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg},
  phoneRow: {flexDirection: 'row', alignItems: 'flex-end'},
  prefixBox: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    marginRight: spacing.sm,
    marginBottom: spacing.md,
  },
  prefixText: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text},
  phoneField: {flex: 1},
  errorBox: {backgroundColor: colors.dangerSoft, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm},
  errorText: {color: colors.danger, fontSize: font.size.sm},
  back: {alignSelf: 'center', marginTop: spacing.lg},
  backText: {color: colors.textMuted, fontSize: font.size.sm},
});
