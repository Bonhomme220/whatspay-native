import React, {useState} from 'react';
import {
  Alert,
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
import {colors, font, radius, spacing} from '../theme';
import {Button, TextField} from '../components/ui';
import {submitReactivation} from '../api/reactivation';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'Reactivation'>;

export default function ReactivationScreen({route, navigation}: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert('Email requis', 'Renseigne l’email de ton compte.');
      return;
    }
    if (reason.trim().length < 20) {
      Alert.alert('Motif trop court', 'Explique pourquoi réactiver ton compte (20 caractères min.).');
      return;
    }
    setBusy(true);
    try {
      const r = await submitReactivation(email.trim(), reason.trim());
      Alert.alert(r.success ? 'Demande envoyée' : 'Impossible', r.message, [
        {text: 'OK', onPress: () => r.success && navigation.navigate('Login')},
      ]);
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Réactiver mon compte</Text>
          <Text style={styles.subtitle}>
            Ton compte est désactivé. Explique-nous pourquoi tu souhaites le réactiver — l’équipe te répondra par email.
          </Text>

          <TextField label="Email du compte" value={email} onChangeText={setEmail} placeholder="ton@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Motif</Text>
          <TextInput
            style={styles.textarea}
            value={reason}
            onChangeText={setReason}
            placeholder="Explique ta demande (20 caractères min.)…"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Button title="Envoyer ma demande" onPress={submit} loading={busy} style={{marginTop: spacing.md}} />
          <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backText}>‹ Retour à la connexion</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text},
  subtitle: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20},
  label: {fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: font.weight.medium},
  textarea: {minHeight: 130, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: font.size.md, color: colors.text, backgroundColor: colors.card, textAlignVertical: 'top'},
  back: {alignSelf: 'center', marginTop: spacing.lg},
  backText: {color: colors.textMuted, fontSize: font.size.sm},
});
