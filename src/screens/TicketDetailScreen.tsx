import React, {useCallback, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {fetchTicket, replyTicket, TicketDetail} from '../api/tickets';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TicketDetail'>;
const GREEN = '#16a34a';

function fmtTime(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
}

export default function TicketDetailScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setTicket(await fetchTicket(id));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyTicket(id, reply.trim());
      setReply('');
      await load();
    } catch {
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  const isClosed = ticket.status === 'closed';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color="#fff" />
          <Text style={styles.subject} numberOfLines={2}>{ticket.subject}</Text>
        </TouchableOpacity>
        <View style={[styles.pill, {backgroundColor: isClosed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.25)'}]}>
          <Text style={styles.pillText}>{isClosed ? 'Fermé' : 'Ouvert'}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.messages}>
        {ticket.messages.map(m => {
          const fromSupport = m.is_admin || m.is_ai;
          return (
            <View key={m.id} style={[styles.bubbleRow, {justifyContent: fromSupport ? 'flex-start' : 'flex-end'}]}>
              <View style={[styles.bubble, fromSupport ? styles.bubbleSupport : styles.bubbleUser]}>
                {fromSupport && <Text style={styles.sender}>{m.is_ai ? 'Assistant' : 'Support'}</Text>}
                <Text style={[styles.msgText, {color: fromSupport ? '#374151' : '#fff'}]}>{m.message}</Text>
                <Text style={[styles.msgTime, {color: fromSupport ? '#9ca3af' : 'rgba(255,255,255,0.7)'}]}>{fmtTime(m.created_at)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Reply bar */}
      {isClosed ? (
        <View style={styles.closedBar}><Text style={styles.closedText}>Ce ticket est fermé.</Text></View>
      ) : (
        <View style={styles.replyBar}>
          <TextInput style={styles.replyInput} value={reply} onChangeText={setReply} placeholder="Votre message…" placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={[styles.sendBtn, (!reply.trim() || sending) && {opacity: 0.5}]} onPress={send} disabled={!reply.trim() || sending}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  backRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  subject: {color: '#fff', fontSize: font.size.md, fontWeight: font.weight.bold, flex: 1},
  pill: {borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4},
  pillText: {color: '#fff', fontSize: 10, fontWeight: font.weight.bold},
  messages: {padding: 16, gap: 10},
  bubbleRow: {flexDirection: 'row', marginBottom: 10},
  bubble: {maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10},
  bubbleSupport: {backgroundColor: '#fff', borderTopLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1},
  bubbleUser: {backgroundColor: GREEN, borderTopRightRadius: 4},
  sender: {color: GREEN, fontSize: 10, fontWeight: font.weight.bold, marginBottom: 2},
  msgText: {fontSize: font.size.sm, lineHeight: 19},
  msgTime: {fontSize: 9, marginTop: 4, alignSelf: 'flex-end'},
  closedBar: {padding: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb', backgroundColor: '#fff'},
  closedText: {color: '#9ca3af', fontSize: font.size.sm},
  replyBar: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb', backgroundColor: '#fff'},
  replyInput: {flex: 1, backgroundColor: '#f3f4f6', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: font.size.sm, color: '#1f2937'},
  sendBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center'},
});
