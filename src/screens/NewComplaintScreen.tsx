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
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Button} from '../components/ui';
import {createComplaint} from '../api/complaints';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'NewComplaint'>;

export default function NewComplaintScreen({route, navigation}: Props) {
  const {missionId} = route.params;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (message.trim().length < 20) {
      Alert.alert('Message trop court', 'Explique ta réclamation (au moins 20 caractères).');
      return;
    }
    setBusy(true);
    try {
      const r = await createComplaint(missionId, message.trim());
      if (r.success) {
        Alert.alert('Réclamation envoyée', r.message ?? 'L’équipe te répondra rapidement.', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert('Impossible', r.message ?? 'Réclamation non éligible.');
      }
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Déposer une réclamation</Text>
          <Text style={styles.subtitle}>
            Explique pourquoi tu contestes la décision sur cette mission. Sois précis.
          </Text>
          <TextInput
            style={styles.textarea}
            value={message}
            onChangeText={setMessage}
            placeholder="Décris le problème (20 caractères min.)…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Button title="Envoyer" onPress={submit} loading={busy} style={{marginTop: spacing.md}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  header: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text},
  subtitle: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20},
  textarea: {minHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: font.size.md, color: colors.text, backgroundColor: colors.card, textAlignVertical: 'top'},
});
