import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, TextField} from '../components/ui';
import {colors, font, spacing} from '../theme';
import {apiErrorMessage} from '../api/client';
import {forgotPassword} from '../api/auth';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError('Renseigne ton email.');
      return;
    }
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setMessage(data?.message ?? 'Un code de réinitialisation a été envoyé par email.');
      // Enchaîne vers la saisie du code + nouveau mot de passe.
      navigation.navigate('ResetPassword', {email: email.trim()});
    } catch (e) {
      setError(apiErrorMessage(e, 'Envoi impossible.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>Entre ton email pour recevoir un lien de réinitialisation.</Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ton@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {!!message && (
          <View style={styles.okBox}>
            <Text style={styles.okText}>{message}</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button title="Envoyer le code" onPress={submit} loading={loading} style={{marginTop: spacing.sm}} />
        <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('ResetPassword', {email: email.trim()})}>
          <Text style={styles.backText}>J'ai déjà un code ›</Text>
        </TouchableOpacity>
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
  okBox: {backgroundColor: colors.primarySoft, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm},
  okText: {color: colors.primaryDark, fontSize: font.size.sm},
  errorBox: {backgroundColor: colors.dangerSoft, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm},
  errorText: {color: colors.danger, fontSize: font.size.sm},
  back: {alignSelf: 'center', marginTop: spacing.lg},
  backText: {color: colors.textMuted, fontSize: font.size.sm},
});
