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
import {Button, TextField} from '../components/ui';
import {createTicket} from '../api/tickets';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'NewTicket'>;

export default function NewTicketScreen({navigation}: Props) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (subject.trim().length < 5) {
      Alert.alert('Sujet trop court', 'Le sujet doit faire au moins 5 caractères.');
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert('Message trop court', 'Décris ton problème (au moins 10 caractères).');
      return;
    }
    setBusy(true);
    try {
      const r = await createTicket(subject.trim(), message.trim());
      if (r.id) {
        navigation.replace('TicketDetail', {id: r.id});
      } else {
        navigation.goBack();
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
          <Text style={styles.title}>Nouveau ticket</Text>
          <TextField label="Sujet" value={subject} onChangeText={setSubject} placeholder="Résume ton problème" />
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.textarea}
            value={message}
            onChangeText={setMessage}
            placeholder="Explique en détail…"
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
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.lg},
  label: {fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: font.weight.medium},
  textarea: {minHeight: 140, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: font.size.md, color: colors.text, backgroundColor: colors.card, textAlignVertical: 'top'},
});
