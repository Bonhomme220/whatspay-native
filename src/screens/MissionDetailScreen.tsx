import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Button, TextField} from '../components/ui';
import {acceptMission, fetchMission, Mission, ProofFile, submitProof} from '../api/missions';
import {apiErrorMessage} from '../api/client';
import {money, statusMeta} from '../lib/status';

type Props = NativeStackScreenProps<AppStackParamList, 'MissionDetail'>;

export default function MissionDetailScreen({route, navigation}: Props) {
  const {id} = route.params;
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Soumission de preuve
  const [proof, setProof] = useState<ProofFile | null>(null);
  const [vues, setVues] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setMission(await fetchMission(id));
    } catch (e) {
      setError(apiErrorMessage(e, 'Mission introuvable.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onAccept = async () => {
    setBusy(true);
    try {
      await acceptMission(id);
      Alert.alert('Mission acceptée', 'Tu participes maintenant à cette mission.');
      await load();
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pickProof = async () => {
    const res = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (res.didCancel) return;
    const asset = res.assets?.[0];
    if (asset?.uri) {
      setProof({uri: asset.uri, type: asset.type, fileName: asset.fileName ?? undefined});
    }
  };

  const onSubmit = async () => {
    if (!proof) {
      Alert.alert('Capture requise', 'Ajoute une capture de tes vues comme preuve.');
      return;
    }
    const n = parseInt(vues, 10);
    if (isNaN(n) || n < 0) {
      Alert.alert('Vues invalides', 'Indique le nombre de vues obtenues.');
      return;
    }
    setBusy(true);
    try {
      const r = await submitProof(id, n, proof);
      if (r.success) {
        Alert.alert('Preuve envoyée', r.message ?? 'Ta soumission est en cours de vérification.');
        setProof(null);
        setVues('');
        await load();
      } else {
        Alert.alert('Échec', r.message ?? 'Soumission refusée.');
      }
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!mission) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Mission introuvable.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const task = mission.task;
  const meta = statusMeta(mission.status);
  const canAccept = mission.status === 'ASSIGNED';
  const canSubmit = mission.status === 'PENDING' || mission.status === 'SUBMISSION_REJECTED';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headRow}>
          <Text style={styles.name}>{task?.name ?? 'Campagne'}</Text>
          <View style={[styles.badge, {backgroundColor: meta.bg}]}>
            <Text style={[styles.badgeText, {color: meta.color}]}>{meta.label}</Text>
          </View>
        </View>
        {!!task?.client_name && <Text style={styles.client}>{task.client_name}</Text>}

        <View style={styles.gainCard}>
          <Text style={styles.gainLabel}>Gain estimé</Text>
          <Text style={styles.gainValue}>{money(mission.gain || mission.expected_gain)}</Text>
        </View>

        {!!task?.description && (
          <Section title="Description">
            <Text style={styles.body}>{task.description}</Text>
          </Section>
        )}

        {!!task?.legend && (
          <Section title="Légende à publier">
            <Text style={styles.body}>{task.legend}</Text>
          </Section>
        )}

        {!!mission.tracking_url && (
          <Section title="Lien de diffusion">
            <TouchableOpacity onPress={() => Linking.openURL(mission.tracking_url!)}>
              <Text style={styles.link} numberOfLines={2}>
                {mission.tracking_url}
              </Text>
            </TouchableOpacity>
          </Section>
        )}

        {/* Actions */}
        {canAccept && (
          <Button title="Accepter la mission" onPress={onAccept} loading={busy} style={{marginTop: spacing.lg}} />
        )}

        {canSubmit && (
          <Section title="Soumettre ma preuve">
            <TouchableOpacity style={styles.pickBox} onPress={pickProof} activeOpacity={0.85}>
              {proof ? (
                <Image source={{uri: proof.uri}} style={styles.preview} resizeMode="cover" />
              ) : (
                <View style={styles.pickInner}>
                  <Text style={styles.pickIcon}>📷</Text>
                  <Text style={styles.pickText}>Ajouter une capture de tes vues</Text>
                </View>
              )}
            </TouchableOpacity>
            {!!proof && (
              <TouchableOpacity onPress={pickProof}>
                <Text style={styles.changeText}>Changer la capture</Text>
              </TouchableOpacity>
            )}
            <TextField
              label="Nombre de vues obtenues"
              value={vues}
              onChangeText={setVues}
              placeholder="Ex : 340"
              keyboardType="number-pad"
            />
            <Button title="Envoyer ma preuve" onPress={onSubmit} loading={busy} />
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({onBack}: {onBack: () => void}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Text style={styles.back}>‹ Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  header: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  headRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  name: {flex: 1, fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginRight: spacing.sm},
  client: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs},
  gainCard: {backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg},
  gainLabel: {color: colors.primarySoft, fontSize: font.size.sm},
  gainValue: {color: colors.textOnPrimary, fontSize: font.size.xl, fontWeight: font.weight.bold, marginTop: 2},
  section: {marginTop: spacing.xl},
  sectionTitle: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.sm},
  body: {fontSize: font.size.md, color: colors.text, lineHeight: 22},
  link: {fontSize: font.size.sm, color: colors.primary},
  badge: {borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4},
  badgeText: {fontSize: font.size.xs, fontWeight: font.weight.bold},
  pickBox: {height: 200, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden', backgroundColor: colors.card, marginBottom: spacing.sm},
  pickInner: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  pickIcon: {fontSize: 34, marginBottom: spacing.sm},
  pickText: {color: colors.textMuted, fontSize: font.size.sm},
  preview: {width: '100%', height: '100%'},
  changeText: {color: colors.primary, fontSize: font.size.sm, fontWeight: font.weight.medium, marginBottom: spacing.md},
  errorText: {color: colors.danger, fontSize: font.size.md, textAlign: 'center'},
});
