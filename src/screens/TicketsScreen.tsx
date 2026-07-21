import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {createTicket, fetchTickets, TicketListItem} from '../api/tickets';
import {apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Tickets'>;
const GREEN = '#16a34a';

const STATUS: Record<string, {label: string; bg: string; fg: string}> = {
  open: {label: 'Ouvert', bg: '#dcfce7', fg: '#15803d'},
  closed: {label: 'Fermé', bg: '#f3f4f6', fg: '#6b7280'},
};
function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

export default function TicketsScreen({navigation}: Props) {
  const [items, setItems] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchTickets());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    setError(null);
    if (subject.trim().length < 5) {setError('Sujet trop court (5 caractères min).'); return;}
    if (message.trim().length < 10) {setError('Message trop court (10 caractères min).'); return;}
    setCreating(true);
    try {
      const r = await createTicket(subject.trim(), message.trim());
      setShowNew(false);
      setSubject('');
      setMessage('');
      if (r.id) navigation.navigate('TicketDetail', {id: r.id});
      else load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={16} color="#dcfce7" /><Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroTitle}>Mes Tickets</Text>
            <Text style={styles.heroSub}>Besoin d'aide ? Contacte le support</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(true)}>
            <Icon name="add" size={18} color={GREEN} />
            <Text style={styles.newText}>Nouveau</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Icon name="chatbubbles-outline" size={30} color="#9ca3af" /></View>
              <Text style={styles.emptyText}>Aucun ticket pour l'instant.</Text>
              <TouchableOpacity onPress={() => setShowNew(true)}><Text style={styles.emptyLink}>Créer mon premier ticket →</Text></TouchableOpacity>
            </View>
          }
          renderItem={({item}) => {
            const s = STATUS[item.status] ?? {label: item.status, bg: '#f3f4f6', fg: '#6b7280'};
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TicketDetail', {id: item.id})} activeOpacity={0.85}>
                <View style={styles.cardTop}>
                  <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                  <View style={[styles.pill, {backgroundColor: s.bg}]}><Text style={[styles.pillText, {color: s.fg}]}>{s.label}</Text></View>
                </View>
                {!!item.last_message && <Text style={styles.preview} numberOfLines={1}>{item.last_message.is_admin || item.last_message.is_ai ? 'Support : ' : 'Vous : '}{item.last_message.message}</Text>}
                <Text style={styles.date}>{fmtDate(item.updated_at ?? item.created_at)}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Nouveau ticket */}
      <Modal visible={showNew} transparent animationType="slide" onRequestClose={() => setShowNew(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Nouveau ticket</Text>
            <Text style={styles.label}>Sujet</Text>
            <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Résumez votre problème en quelques mots" placeholderTextColor="#9ca3af" />
            <Text style={styles.label}>Message</Text>
            <TextInput style={[styles.input, styles.textarea]} value={message} onChangeText={setMessage} placeholder="Décrivez votre problème en détail…" placeholderTextColor="#9ca3af" multiline />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={[styles.cta, creating && {opacity: 0.6}]} onPress={create} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Envoyer</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNew(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40},
  back: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12},
  backText: {color: '#dcfce7', fontSize: font.size.sm},
  heroRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroSub: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 2},
  newBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8},
  newText: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
  body: {padding: 16, marginTop: -24, flexGrow: 1},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  subject: {flex: 1, color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.bold},
  preview: {color: '#6b7280', fontSize: font.size.xs, marginTop: 6},
  date: {color: '#9ca3af', fontSize: 10, marginTop: 6},
  pill: {borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3},
  pillText: {fontSize: 10, fontWeight: font.weight.bold},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  emptyText: {color: '#6b7280', fontSize: font.size.sm},
  emptyLink: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold, marginTop: 8},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalSheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20},
  modalTitle: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold, marginBottom: 12},
  label: {color: '#374151', fontSize: font.size.xs, fontWeight: font.weight.medium, marginBottom: 6, marginTop: 8},
  input: {backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.size.sm, color: '#1f2937'},
  textarea: {minHeight: 110, textAlignVertical: 'top'},
  errorText: {color: '#dc2626', fontSize: font.size.xs, marginTop: 8},
  cta: {backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 16},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
  modalCancel: {alignItems: 'center', paddingVertical: 12},
  modalCancelText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
});
