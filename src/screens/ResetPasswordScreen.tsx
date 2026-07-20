import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';
import {colors, font, spacing} from '../theme';
import {Button, TextField} from '../components/ui';
import {resetPassword} from '../api/auth';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({route, navigation}: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !code.trim()) {
      Alert.alert('Champs requis', 'Renseigne ton email et le code reçu.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Trop court', 'Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Non concordant', 'La confirmation ne correspond pas.');
      return;
    }
    setBusy(true);
    try {
      const r = await resetPassword(email.trim(), code.trim(), password, confirm);
      Alert.alert('Mot de passe réinitialisé', r.message ?? 'Tu peux te connecter.', [
        {text: 'OK', onPress: () => navigation.navigate('Login')},
      ]);
    } catch (e) {
      Alert.alert('Échec', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Réinitialiser le mot de passe</Text>
        <Text style={styles.subtitle}>Entre le code reçu par email et ton nouveau mot de passe.</Text>

        <TextField label="Email" value={email} onChangeText={setEmail} placeholder="ton@email.com" autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Code reçu" value={code} onChangeText={setCode} placeholder="Code de vérification" autoCapitalize="none" />
        <TextField label="Nouveau mot de passe" value={password} onChangeText={setPassword} placeholder="8 caractères min." secureTextEntry />
        <TextField label="Confirmer" value={confirm} onChangeText={setConfirm} placeholder="Répète le mot de passe" secureTextEntry />

        <Button title="Réinitialiser" onPress={submit} loading={busy} style={{marginTop: spacing.sm}} />
        <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Login')}>
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
  back: {alignSelf: 'center', marginTop: spacing.lg},
  backText: {color: colors.textMuted, fontSize: font.size.sm},
});
