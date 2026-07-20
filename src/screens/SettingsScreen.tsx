import React, {useEffect, useState} from 'react';
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
import {Select} from '../components/Select';
import {changePassword, fetchProfile, requestDeletion, updateLocation} from '../api/profile';
import {fetchArrondissements, fetchQuartiers, Ref} from '../api/reference';
import {useAuth} from '../context/AuthContext';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

function Card({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen({navigation}: Props) {
  const {signOut} = useAuth();

  // Mot de passe
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  // Localisation
  const [localityId, setLocalityId] = useState<string | null>(null);
  const [arrs, setArrs] = useState<Ref[]>([]);
  const [quartiers, setQuartiers] = useState<Ref[]>([]);
  const [arrId, setArrId] = useState('');
  const [quartierId, setQuartierId] = useState('');
  const [locBusy, setLocBusy] = useState(false);

  // Suppression
  const [reason, setReason] = useState('');
  const [delBusy, setDelBusy] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then(p => {
        setLocalityId(p.locality?.id ?? null);
        setArrId(p.arrondissement?.id ?? '');
        setQuartierId(p.quartier?.id ?? '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!localityId) return;
    fetchArrondissements(localityId).then(setArrs).catch(() => setArrs([]));
  }, [localityId]);

  useEffect(() => {
    if (!arrId) {
      setQuartiers([]);
      return;
    }
    fetchQuartiers(arrId).then(setQuartiers).catch(() => setQuartiers([]));
  }, [arrId]);

  const submitPassword = async () => {
    if (newPwd.length < 8) {
      Alert.alert('Trop court', 'Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Non concordant', 'La confirmation ne correspond pas.');
      return;
    }
    setPwdBusy(true);
    try {
      const r = await changePassword(curPwd, newPwd, confirmPwd);
      Alert.alert(r.success ? 'Succès' : 'Info', r.message);
      if (r.success) {
        setCurPwd('');
        setNewPwd('');
        setConfirmPwd('');
      }
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setPwdBusy(false);
    }
  };

  const submitLocation = async () => {
    if (!arrId || !quartierId) {
      Alert.alert('Champs requis', 'Choisis ton arrondissement et ton quartier.');
      return;
    }
    setLocBusy(true);
    try {
      const r = await updateLocation(arrId, quartierId);
      Alert.alert(r.success ? 'Succès' : 'Info', r.message);
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setLocBusy(false);
    }
  };

  const submitDeletion = () => {
    if (reason.trim().length < 10) {
      Alert.alert('Motif requis', 'Explique la raison (au moins 10 caractères).');
      return;
    }
    Alert.alert('Supprimer mon compte', 'Cette action est définitive. Confirmer la demande ?', [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: async () => {
          setDelBusy(true);
          try {
            const r = await requestDeletion(reason.trim());
            Alert.alert(r.success ? 'Demande envoyée' : 'Info', r.message);
            if (r.success) setReason('');
          } catch (e) {
            Alert.alert('Erreur', apiErrorMessage(e));
          } finally {
            setDelBusy(false);
          }
        },
      },
    ]);
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
          <Text style={styles.title}>Paramètres</Text>

          <Card title="Changer mon mot de passe">
            <TextField label="Mot de passe actuel" value={curPwd} onChangeText={setCurPwd} secureTextEntry placeholder="••••••••" />
            <TextField label="Nouveau mot de passe" value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholder="8 caractères min." />
            <TextField label="Confirmer" value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry placeholder="Répète le mot de passe" />
            <Button title="Mettre à jour" onPress={submitPassword} loading={pwdBusy} />
          </Card>

          <Card title="Préciser ma localisation">
            <Select label="Arrondissement" options={arrs} value={arrId} onChange={v => {
              setArrId(v);
              setQuartierId('');
            }} disabled={!localityId} />
            <Select label="Quartier" options={quartiers} value={quartierId} onChange={setQuartierId} disabled={!arrId} />
            <Button title="Enregistrer" onPress={submitLocation} loading={locBusy} />
          </Card>

          <Card title="Supprimer mon compte">
            <Text style={styles.danger}>Cette demande est traitée par l'équipe. Action irréversible.</Text>
            <TextField label="Motif" value={reason} onChangeText={setReason} placeholder="Pourquoi souhaites-tu partir ?" />
            <Button title="Demander la suppression" variant="outline" onPress={submitDeletion} loading={delBusy} />
          </Card>

          <Button title="Se déconnecter" variant="outline" onPress={signOut} style={{marginTop: spacing.sm}} />
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
  card: {backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border},
  cardTitle: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md},
  danger: {fontSize: font.size.sm, color: colors.danger, marginBottom: spacing.md},
});
