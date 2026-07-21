import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {fetchGains, GainsResponse, GainTransaction} from '../api/gains';
import {api, apiErrorMessage} from '../api/client';
import Icon from '../components/Icon';
import {font} from '../theme';

const GREEN = '#16a34a';
type Filter = 'tous' | 'gains' | 'retraits';

const fmt = (n?: number | null) => Math.round(Number(n ?? 0)).toLocaleString('fr-FR');
function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
}
function statusBadge(status?: string): {label: string; color: string} | null {
  const s = (status ?? '').toUpperCase();
  if (['COMPLETED', 'SUCCESS', 'PAID', 'SUBMISSION_ACCEPTED', 'CONFIRMED'].includes(s)) return {label: 'Confirmé', color: '#16a34a'};
  if (['PENDING', 'PROCESSING'].includes(s)) return {label: 'En cours', color: '#f59e0b'};
  if (['FAILED', 'REJECTED', 'CANCELLED'].includes(s)) return {label: 'Échoué', color: '#ef4444'};
  return null;
}

export default function GainsScreen() {
  const [data, setData] = useState<GainsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('tous');
  const [detailTx, setDetailTx] = useState<GainTransaction | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setData(await fetchGains());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={GREEN} size="large" /></View>;
  }
  if (!data) return null;

  const pending: any = data.pending_withdrawal;
  const pendingAmount = pending && typeof pending === 'object' ? pending.amount : pending;
  const hasPending = !!pendingAmount;

  const transactions = data.transactions ?? [];
  const filtered = filter === 'gains' ? transactions.filter(t => t.type === 'Crédit')
    : filter === 'retraits' ? transactions.filter(t => t.type !== 'Crédit')
    : transactions;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{paddingBottom: 24}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#fff" colors={[GREEN]} />}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Mes Gains</Text>
          <Text style={styles.heroLabel}>Solde disponible</Text>
          <Text style={styles.balance}>{fmt(data.balance)} <Text style={styles.balanceF}>F</Text></Text>

          <View style={styles.subStats}>
            {[
              {label: 'Total gains', value: `${fmt(data.total_gain)} F`},
              {label: 'Ce mois', value: `${fmt(data.this_month)} F`},
              {label: 'Mois préc.', value: `${fmt(data.last_month)} F`},
            ].map(s => (
              <View key={s.label}>
                <Text style={styles.subLabel}>{s.label}</Text>
                <Text style={styles.subValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chipsGrid}>
            {[
              {label: 'Campagnes terminées', value: fmt(data.campagnes_terminees)},
              {label: 'Vues totales', value: fmt(data.total_vues)},
              {label: 'En cours', value: fmt(data.en_cours)},
              {label: 'Par vue', value: `${fmt(data.par_vue)} F`},
            ].map(s => (
              <View key={s.label} style={styles.chip}>
                <Text style={styles.chipValue}>{s.value}</Text>
                <Text style={styles.chipLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdraw(true)} activeOpacity={0.85}>
              <Icon name="arrow-down-outline" size={16} color="#fff" />
              <Text style={styles.withdrawText}>Retrait</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => load(true)}>
              <Icon name="refresh-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending banner */}
        {hasPending && (
          <View style={styles.pendingWrap}>
            <View style={styles.pendingBox}>
              <View style={styles.pendingIcon}><Icon name="time-outline" size={16} color="#d97706" /></View>
              <View style={{flex: 1}}>
                <Text style={styles.pendingTitle}>Retrait en cours de traitement</Text>
                <Text style={styles.pendingSub}>Votre retrait de {fmt(pendingAmount)} F est en cours. Le retrait peut prendre plusieurs jours ouvrés.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Historique */}
        <View style={[styles.histCard, !hasPending && {marginTop: -24}]}>
          <View style={styles.histHead}>
            <Text style={styles.histTitle}>Historique</Text>
            {(['tous', 'gains', 'retraits'] as Filter[]).map(f => (
              <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipOn]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyTx}><Text style={styles.emptyTxText}>Aucune transaction.</Text></View>
          ) : (
            filtered.map(t => {
              const isCredit = t.type === 'Crédit';
              const badge = statusBadge(t.status);
              return (
                <TouchableOpacity key={t.id} style={styles.txRow} onPress={() => setDetailTx(t)} activeOpacity={0.7}>
                  <View style={[styles.txIcon, {backgroundColor: isCredit ? '#f0fdf4' : '#fef2f2'}]}>
                    <Icon name={isCredit ? 'arrow-down' : 'arrow-up'} size={16} color={isCredit ? GREEN : '#ef4444'} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                    <View style={styles.txMeta}>
                      <Icon name="calendar-outline" size={11} color="#9ca3af" />
                      <Text style={styles.txDate}>{fmtDate(t.created_at)}</Text>
                      {!!badge && <Text style={[styles.txBadge, {color: badge.color}]}>· {badge.label}</Text>}
                    </View>
                  </View>
                  <Text style={[styles.txAmount, {color: isCredit ? GREEN : '#ef4444'}]}>{isCredit ? '+' : '-'}{fmt(t.amount)} F</Text>
                  <Icon name="chevron-forward" size={16} color="#d1d5db" />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Détail transaction */}
      <Modal visible={!!detailTx} transparent animationType="slide" onRequestClose={() => setDetailTx(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            {!!detailTx && (
              <>
                <View style={[styles.sheetIcon, {backgroundColor: detailTx.type === 'Crédit' ? '#f0fdf4' : '#fef2f2'}]}>
                  <Icon name={detailTx.type === 'Crédit' ? 'arrow-down' : 'arrow-up'} size={26} color={detailTx.type === 'Crédit' ? GREEN : '#ef4444'} />
                </View>
                <Text style={[styles.sheetAmount, {color: detailTx.type === 'Crédit' ? GREEN : '#ef4444'}]}>
                  {detailTx.type === 'Crédit' ? '+' : '-'}{fmt(detailTx.amount)} F
                </Text>
                <Text style={styles.sheetDesc}>{detailTx.description}</Text>
                <View style={styles.sheetRows}>
                  <SheetRow label="Date" value={fmtDate(detailTx.created_at)} />
                  <SheetRow label="Statut" value={statusBadge(detailTx.status)?.label ?? detailTx.status ?? '—'} />
                  {!!detailTx.reference && <SheetRow label="Référence" value={detailTx.reference} />}
                  {!!detailTx.rejection_reason && <SheetRow label="Motif" value={detailTx.rejection_reason} />}
                </View>
                <TouchableOpacity style={styles.sheetClose} onPress={() => setDetailTx(null)}><Text style={styles.sheetCloseText}>Fermer</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal retrait */}
      {showWithdraw && (
        <WithdrawModal
          balance={data.balance}
          hasPending={hasPending}
          pendingAmount={pendingAmount}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {setShowWithdraw(false); load(true);}}
        />
      )}
    </View>
  );
}

function SheetRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.sheetRow}>
      <Text style={styles.sheetRowLabel}>{label}</Text>
      <Text style={styles.sheetRowValue}>{value}</Text>
    </View>
  );
}

function WithdrawModal({balance, hasPending, pendingAmount, onClose, onSuccess}: {
  balance: number; hasPending: boolean; pendingAmount?: number; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const max = Math.min(balance, 500000);

  const submit = async () => {
    setError(null);
    const n = Number(amount);
    if (isNaN(n) || n < 1000) {setError('Montant minimum : 1 000 F.'); return;}
    if (n > max) {setError(`Montant maximum : ${fmt(max)} F.`); return;}
    if (!/^[0-9]{8,15}$/.test(phone)) {setError('Numéro Mobile Money invalide.'); return;}
    setBusy(true);
    try {
      const {data} = await api.post<{success: boolean; message: string}>('/withdraw', {
        amount: n, withdrawal_method: 'mobile_money', phone,
      });
      if (data.success) setDone(true);
      else setError(data.message ?? 'Retrait impossible.');
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          {hasPending ? (
            <>
              <View style={[styles.sheetIcon, {backgroundColor: '#fffbeb'}]}><Icon name="time-outline" size={26} color="#d97706" /></View>
              <Text style={styles.wTitle}>Retrait en cours</Text>
              <Text style={styles.wSub}>Un retrait de {pendingAmount ? `${fmt(pendingAmount)} F` : ''} est déjà en cours de traitement.</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={onClose}><Text style={styles.sheetCloseText}>Compris</Text></TouchableOpacity>
            </>
          ) : done ? (
            <>
              <View style={[styles.sheetIcon, {backgroundColor: '#dcfce7'}]}><Icon name="checkmark" size={30} color={GREEN} /></View>
              <Text style={styles.wTitle}>Demande envoyée !</Text>
              <Text style={styles.wSub}>Votre retrait sera traité dans un délai de 1 à 7 jours ouvrés.</Text>
              <TouchableOpacity style={styles.cta} onPress={onSuccess}><Text style={styles.ctaText}>Terminé</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.wTitle}>Demande de retrait</Text>
              <Text style={styles.wSub}>Solde disponible : <Text style={{color: GREEN, fontWeight: font.weight.bold}}>{fmt(balance)} F</Text></Text>
              <Text style={styles.wLabel}>Montant (F CFA)</Text>
              <TextInput style={styles.wInput} value={amount} onChangeText={setAmount} placeholder="Ex. 5000" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
              <Text style={styles.wHint}>Min. 1 000 F — Max. {fmt(max)} F</Text>
              <Text style={styles.wLabel}>Numéro Mobile Money</Text>
              <TextInput style={styles.wInput} value={phone} onChangeText={setPhone} placeholder="97000000" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
              {!!error && <Text style={styles.wError}>{error}</Text>}
              <TouchableOpacity style={[styles.cta, busy && {opacity: 0.6}]} onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Demander le retrait</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetClose} onPress={onClose}><Text style={styles.sheetCloseText}>Annuler</Text></TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f9fafb'},
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'},
  hero: {backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 56},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: font.weight.bold},
  heroLabel: {color: '#dcfce7', fontSize: font.size.sm, marginTop: 2},
  balance: {color: '#fff', fontSize: 36, fontWeight: font.weight.bold, marginTop: 8},
  balanceF: {fontSize: 22, fontWeight: font.weight.bold},
  subStats: {flexDirection: 'row', gap: 16, marginTop: 8},
  subLabel: {color: '#dcfce7', fontSize: 10},
  subValue: {color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold},
  chipsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16},
  chip: {width: '47.5%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)'},
  chipValue: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.lg},
  chipLabel: {color: '#dcfce7', fontSize: 10, marginTop: 1},
  actions: {flexDirection: 'row', gap: 12, marginTop: 16},
  withdrawBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)'},
  withdrawText: {color: '#fff', fontWeight: font.weight.bold, fontSize: font.size.sm},
  refreshBtn: {width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)'},
  pendingWrap: {marginHorizontal: 16, marginTop: -12, marginBottom: 12, zIndex: 10},
  pendingBox: {backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  pendingIcon: {width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center'},
  pendingTitle: {color: '#92400e', fontSize: font.size.sm, fontWeight: font.weight.bold},
  pendingSub: {color: '#b45309', fontSize: font.size.xs, marginTop: 2, lineHeight: 16},
  histCard: {marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  histHead: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6', flexWrap: 'wrap'},
  histTitle: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.bold, marginRight: 'auto'},
  filterChip: {paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: '#f3f4f6'},
  filterChipOn: {backgroundColor: GREEN},
  filterText: {fontSize: font.size.xs, color: '#6b7280', fontWeight: font.weight.bold},
  filterTextOn: {color: '#fff'},
  emptyTx: {padding: 32, alignItems: 'center'},
  emptyTxText: {color: '#9ca3af', fontSize: font.size.sm},
  txRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f9fafb'},
  txIcon: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  txDesc: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium},
  txMeta: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2},
  txDate: {color: '#9ca3af', fontSize: 10},
  txBadge: {fontSize: 10, fontWeight: font.weight.bold},
  txAmount: {fontSize: font.size.sm, fontWeight: font.weight.bold},
  sheetBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center'},
  sheetIcon: {width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  sheetAmount: {fontSize: font.size.xxl, fontWeight: font.weight.bold},
  sheetDesc: {color: '#4b5563', fontSize: font.size.sm, marginTop: 4, textAlign: 'center'},
  sheetRows: {alignSelf: 'stretch', marginTop: 16, gap: 10},
  sheetRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 12},
  sheetRowLabel: {color: '#6b7280', fontSize: font.size.sm},
  sheetRowValue: {color: '#1f2937', fontSize: font.size.sm, fontWeight: font.weight.medium, flexShrink: 1, textAlign: 'right'},
  sheetClose: {alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, marginTop: 12},
  sheetCloseText: {color: '#6b7280', fontSize: font.size.sm, fontWeight: font.weight.medium},
  wTitle: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold, alignSelf: 'flex-start'},
  wSub: {color: '#6b7280', fontSize: font.size.sm, marginTop: 4, marginBottom: 12, alignSelf: 'flex-start'},
  wLabel: {alignSelf: 'flex-start', color: '#374151', fontSize: font.size.xs, fontWeight: font.weight.medium, marginBottom: 6, marginTop: 8},
  wInput: {alignSelf: 'stretch', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.size.sm, color: '#1f2937'},
  wHint: {alignSelf: 'flex-start', color: '#9ca3af', fontSize: 10, marginTop: 4},
  wError: {alignSelf: 'flex-start', color: '#dc2626', fontSize: font.size.xs, marginTop: 8},
  cta: {alignSelf: 'stretch', backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 16},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
