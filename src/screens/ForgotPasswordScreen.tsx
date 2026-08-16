import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, TextField} from '../components/ui';
import {DateField} from '../components/DateField';
import {colors, font, spacing} from '../theme';
import {apiErrorMessage} from '../api/client';
import {verifyResetIdentity} from '../api/auth';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const today = new Date();

export default function ForgotPasswordScreen({navigation}: Props) {
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Renseigne ton numéro de téléphone.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      setError('Renseigne ta date de naissance.');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyResetIdentity(phone.trim(), birthdate);
      // Identité vérifiée → écran de choix du nouveau mot de passe.
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

        <TextField
          label="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="97000000"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <DateField
          label="Date de naissance"
          value={birthdate}
          onChange={setBirthdate}
          maximumDate={today}
        />

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
  errorBox: {backgroundColor: colors.dangerSoft, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm},
  errorText: {color: colors.danger, fontSize: font.size.sm},
  back: {alignSelf: 'center', marginTop: spacing.lg},
  backText: {color: colors.textMuted, fontSize: font.size.sm},
});
