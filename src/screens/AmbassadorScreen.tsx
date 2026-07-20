import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';
import {Button, TextField} from '../components/ui';
import {
  activateAmbassador,
  AmbassadorData,
  enterAmbassadorCode,
  fetchAmbassador,
} from '../api/ambassador';
import {apiErrorMessage} from '../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'Ambassador'>;

export default function AmbassadorScreen({navigation}: Props) {
  const [data, setData] = useState<AmbassadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await fetchAmbassador());
    } catch {
      // affichage minimal
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onActivate = async () => {
    setBusy(true);
    try {
      const r = await activateAmbassador();
      Alert.alert(r.success ? 'Bravo !' : 'Info', r.message);
      if (r.success) await load();
    } catch (e) {
      Alert.alert('Erreur', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onEnterCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await enterAmbassadorCode(code.trim());
      Alert.alert(r.success ? 'Merci !' : 'Info', r.message);
      if (r.success) {
        setCode('');
        await load();
      }
    } catch (e) {
      Alert.alert('Code invalide', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shareCode = async () => {
    if (!data?.ambassador_code) return;
    try {
      await Share.share({
        message: `Rejoins WhatsPAY avec mon code ambassadeur ${data.ambassador_code} et monétise tes Status WhatsApp ! https://app.whatspay.africa`,
      });
    } catch {}
  };

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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Programme ambassadeur</Text>

          {data?.is_ambassador ? (
            <>
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Ton code ambassadeur</Text>
                <Text style={styles.code}>{data.ambassador_code}</Text>
                <Button title="Partager mon code" onPress={shareCode} style={{marginTop: spacing.md}} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{data.stat?.active_referrals ?? 0}</Text>
                  <Text style={styles.statLabel}>Filleuls actifs</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{data.stat?.total_referrals ?? 0}</Text>
                  <Text style={styles.statLabel}>Filleuls total</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  Tu gagnes <Text style={styles.infoStrong}>{data.gain_per_view} FCFA</Text> par vue générée par tes filleuls.
                </Text>
              </View>

              <Text style={styles.section}>Mes filleuls</Text>
              {(data.referrals ?? []).length === 0 ? (
                <Text style={styles.empty}>Aucun filleul pour le moment. Partage ton code !</Text>
              ) : (
                data.referrals.map(r => (
                  <View key={r.id} style={styles.refRow}>
                    <Text style={styles.refName}>{r.name}</Text>
                    <Text style={styles.refMissions}>{r.missions ?? 0} missions</Text>
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  Deviens ambassadeur et gagne sur les vues générées par les diffuseurs que tu parraines.
                </Text>
              </View>

              {data?.is_eligible ? (
                <Button title="Activer mon compte ambassadeur" onPress={onActivate} loading={busy} />
              ) : (
                <View style={styles.warnCard}>
                  <Text style={styles.warnText}>
                    Tu n'es pas encore éligible. Continue à réaliser des missions avec régularité pour le devenir.
                  </Text>
                </View>
              )}

              {!data?.has_referrer && (
                <View style={{marginTop: spacing.xl}}>
                  <Text style={styles.section}>As-tu un code parrain ?</Text>
                  <TextField
                    value={code}
                    onChangeText={setCode}
                    placeholder="Code ambassadeur"
                    autoCapitalize="characters"
                  />
                  <Button title="Valider le code" variant="outline" onPress={onEnterCode} loading={busy} />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
  back: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.lg},
  codeCard: {backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg},
  codeLabel: {color: colors.primarySoft, fontSize: font.size.sm},
  code: {color: colors.textOnPrimary, fontSize: font.size.xxl, fontWeight: font.weight.bold, letterSpacing: 2, marginTop: spacing.xs},
  statsRow: {flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg},
  statCard: {flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border},
  statValue: {fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text},
  statLabel: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2},
  infoCard: {backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg},
  infoText: {fontSize: font.size.sm, color: colors.primaryDark, lineHeight: 20},
  infoStrong: {fontWeight: font.weight.bold},
  warnCard: {backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: spacing.lg},
  warnText: {fontSize: font.size.sm, color: '#92400e', lineHeight: 20},
  section: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm},
  empty: {color: colors.textMuted, fontSize: font.size.sm},
  refRow: {flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border},
  refName: {fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium},
  refMissions: {fontSize: font.size.sm, color: colors.textMuted},
});
