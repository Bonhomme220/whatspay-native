import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {submitReactivation, reactivationStatus, type ReactivationStatus} from '../api/reactivation';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'Reactivation'>;

const fmtDate = (s?: string | null) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
};

export default function ReactivationScreen({route, navigation}: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ReactivationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Récupère le motif de désactivation dès qu'on a un email (toujours affiché).
  const fetchStatus = useCallback(async (mail: string) => {
    if (!mail.trim() || !mail.includes('@')) {
      return;
    }
    setLoadingStatus(true);
    try {
      setStatus(await reactivationStatus(mail.trim()));
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (route.params?.email) {
      fetchStatus(route.params.email);
    }
  }, [route.params?.email, fetchStatus]);

  const pending = status?.pending_request;
  const blocked = pending != null || status?.can_request === false;

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

  const untilLabel = fmtDate(status?.disable_until);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Réactiver mon compte</Text>
          <Text style={styles.subtitle}>
            Ton compte est désactivé. Explique-nous pourquoi tu souhaites le réactiver — l’équipe te répondra par email.
          </Text>

          {/* Motif de désactivation — toujours affiché */}
          {loadingStatus ? (
            <View style={[styles.reasonCard, styles.reasonLoading]}>
              <ActivityIndicator color={colors.danger} />
              <Text style={styles.reasonLoadingText}>Chargement du motif…</Text>
            </View>
          ) : status && (status.disabled_reason || status.disable_type) ? (
            <View style={styles.reasonCard}>
              <Text style={styles.reasonTitle}>⛔ Motif de la désactivation</Text>
              {status.disable_type ? (
                <View style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>Type</Text>
                  <Text style={styles.reasonValue}>{status.disable_type}</Text>
                </View>
              ) : null}
              {untilLabel ? (
                <View style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>Jusqu’au</Text>
                  <Text style={styles.reasonValue}>{untilLabel}</Text>
                </View>
              ) : null}
              <Text style={styles.reasonText}>{status.disabled_reason || 'Aucun détail communiqué.'}</Text>
            </View>
          ) : null}

          <TextField
            label="Email du compte"
            value={email}
            onChangeText={setEmail}
            onBlur={() => fetchStatus(email)}
            placeholder="ton@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Demande déjà en cours */}
          {pending ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Une demande de réactivation est déjà en cours (statut : {pending.status}). L’équipe reviendra vers toi par email.
              </Text>
            </View>
          ) : status?.can_request === false && status?.cant_request_reason ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{status.cant_request_reason}</Text>
            </View>
          ) : null}

          {!blocked ? (
            <>
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
            </>
          ) : null}

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
  reasonCard: {borderWidth: 1, borderColor: '#f5c2c2', backgroundColor: '#fdf2f2', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg},
  reasonLoading: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  reasonLoadingText: {color: colors.danger, fontSize: font.size.sm},
  reasonTitle: {fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.danger, marginBottom: spacing.sm},
  reasonRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  reasonLabel: {fontSize: font.size.xs, color: colors.textMuted},
  reasonValue: {fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.medium, textTransform: 'capitalize'},
  reasonText: {fontSize: font.size.sm, color: '#8a1f1f', marginTop: 4, lineHeight: 19},
  infoCard: {borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md},
  infoText: {fontSize: font.size.sm, color: colors.textMuted, lineHeight: 19},
  back: {alignSelf: 'center', marginTop: spacing.lg},
  backText: {color: colors.textMuted, fontSize: font.size.sm},
});
