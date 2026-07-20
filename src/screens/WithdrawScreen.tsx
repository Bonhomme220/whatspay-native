import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Button, TextField} from '../components/ui';
import {requestWithdraw, WithdrawMethod} from '../api/withdraw';
import {apiErrorMessage} from '../api/client';
import {money} from '../lib/status';

type Props = NativeStackScreenProps<AppStackParamList, 'Withdraw'>;

const MIN = 1000;
const MAX = 500000;

export default function WithdrawScreen({route, navigation}: Props) {
  const balance = route.params?.balance ?? 0;
  const [method, setMethod] = useState<WithdrawMethod>('mobile_money');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < MIN || amt > MAX) {
      Alert.alert('Montant invalide', `Le montant doit être entre ${money(MIN)} et ${money(MAX)}.`);
      return;
    }
    if (amt > balance) {
      Alert.alert('Solde insuffisant', `Ton solde disponible est de ${money(balance)}.`);
      return;
    }
    if (method === 'mobile_money' && !/^[0-9]{8,15}$/.test(phone)) {
      Alert.alert('Numéro invalide', 'Entre un numéro Mobile Money valide (8 à 15 chiffres).');
      return;
    }
    if (method === 'bank' && (!bankName.trim() || !bankAccount.trim())) {
      Alert.alert('Infos manquantes', 'Renseigne la banque et le numéro de compte.');
      return;
    }

    setBusy(true);
    try {
      const res = await requestWithdraw({
        amount: amt,
        withdrawal_method: method,
        phone: method === 'mobile_money' ? phone : undefined,
        bank_name: method === 'bank' ? bankName : undefined,
        bank_account: method === 'bank' ? bankAccount : undefined,
        account_holder: method === 'bank' ? holder : undefined,
      });
      if (res.success) {
        Alert.alert('Demande envoyée', res.message ?? 'Ton retrait est en cours de traitement.', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert('Retrait impossible', res.message ?? 'Réessaie plus tard.');
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
          <Text style={styles.title}>Retirer mes gains</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <Text style={styles.balanceValue}>{money(balance)}</Text>
          </View>

          <Text style={styles.sectionLabel}>Méthode de retrait</Text>
          <View style={styles.methods}>
            <TouchableOpacity
              style={[styles.method, method === 'mobile_money' && styles.methodActive]}
              onPress={() => setMethod('mobile_money')}>
              <Text style={styles.methodIcon}>📱</Text>
              <Text style={[styles.methodText, method === 'mobile_money' && styles.methodTextActive]}>Mobile Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.method, method === 'bank' && styles.methodActive]}
              onPress={() => setMethod('bank')}>
              <Text style={styles.methodIcon}>🏦</Text>
              <Text style={[styles.methodText, method === 'bank' && styles.methodTextActive]}>Banque</Text>
            </TouchableOpacity>
          </View>

          <TextField
            label={`Montant (min ${MIN.toLocaleString('fr-FR')} FCFA)`}
            value={amount}
            onChangeText={setAmount}
            placeholder="Ex : 5000"
            keyboardType="number-pad"
          />

          {method === 'mobile_money' ? (
            <TextField
              label="Numéro Mobile Money"
              value={phone}
              onChangeText={setPhone}
              placeholder="Ex : 97000000"
              keyboardType="phone-pad"
            />
          ) : (
            <>
              <TextField label="Banque" value={bankName} onChangeText={setBankName} placeholder="Nom de la banque" />
              <TextField label="Numéro de compte / IBAN" value={bankAccount} onChangeText={setBankAccount} placeholder="Numéro de compte" />
              <TextField label="Titulaire du compte (optionnel)" value={holder} onChangeText={setHolder} placeholder="Nom du titulaire" />
            </>
          )}

          <Button title="Demander le retrait" onPress={submit} loading={busy} style={{marginTop: spacing.md}} />
          <Text style={styles.note}>Délai de paiement : 1 à 7 jours ouvrés.</Text>
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
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md},
  balanceCard: {backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl},
  balanceLabel: {color: colors.primarySoft, fontSize: font.size.sm},
  balanceValue: {color: colors.textOnPrimary, fontSize: font.size.xl, fontWeight: font.weight.bold, marginTop: 2},
  sectionLabel: {fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.medium, marginBottom: spacing.sm},
  methods: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg},
  method: {flex: 1, alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card},
  methodActive: {borderColor: colors.primary, backgroundColor: colors.primarySoft},
  methodIcon: {fontSize: 26, marginBottom: spacing.xs},
  methodText: {fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.medium},
  methodTextActive: {color: colors.primaryDark, fontWeight: font.weight.bold},
  note: {fontSize: font.size.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md},
});
