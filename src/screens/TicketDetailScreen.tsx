import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {fetchTicket, replyTicket, TicketDetail, TicketMessage} from '../api/tickets';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'TicketDetail'>;

function Bubble({m}: {m: TicketMessage}) {
  const mine = !m.is_admin && !m.is_ai;
  const author = m.is_ai ? 'Assistant' : m.is_admin ? 'Support' : null;
  return (
    <View style={[styles.bubbleRow, mine && {alignItems: 'flex-end'}]}>
      {!!author && <Text style={styles.author}>{author}</Text>}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, mine && {color: colors.textOnPrimary}]}>{m.message}</Text>
      </View>
    </View>
  );
}

export default function TicketDetailScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setTicket(await fetchTicket(id));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    try {
      await replyTicket(id, msg);
      setText('');
      await load();
    } catch (e) {
      // afficher l'erreur en tête ? On garde simple.
      apiErrorMessage(e);
    } finally {
      setSending(false);
    }
  };

  const closed = ticket?.status?.toLowerCase() === 'closed' || ticket?.status?.toLowerCase() === 'fermé';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}>
          <Text style={styles.subject}>{ticket?.subject}</Text>
          <ScrollView contentContainerStyle={styles.thread}>
            {(ticket?.messages ?? []).map(m => (
              <Bubble key={m.id} m={m} />
            ))}
          </ScrollView>

          {closed ? (
            <View style={styles.closedBar}>
              <Text style={styles.closedText}>Ce ticket est fermé.</Text>
            </View>
          ) : (
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Écris ta réponse…"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
                {sending ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.sendText}>›</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  subject: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
  thread: {padding: spacing.lg, paddingBottom: spacing.xl},
  bubbleRow: {marginBottom: spacing.md},
  author: {fontSize: font.size.xs, color: colors.textMuted, marginBottom: 2, marginLeft: spacing.xs},
  bubble: {maxWidth: '82%', padding: spacing.md, borderRadius: radius.lg},
  bubbleMine: {backgroundColor: colors.primary, borderBottomRightRadius: 4, alignSelf: 'flex-end'},
  bubbleOther: {backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4, alignSelf: 'flex-start'},
  bubbleText: {fontSize: font.size.md, color: colors.text, lineHeight: 21},
  inputBar: {flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card},
  input: {flex: 1, maxHeight: 120, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingTop: spacing.sm, fontSize: font.size.md, color: colors.text, backgroundColor: colors.bg},
  sendBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm},
  sendText: {color: colors.textOnPrimary, fontSize: 26, fontWeight: font.weight.bold, marginTop: -4},
  closedBar: {padding: spacing.lg, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border},
  closedText: {color: colors.textMuted, fontSize: font.size.sm},
});
