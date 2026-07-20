import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {colors, font, radius, spacing} from '../theme';
import {Button} from '../components/ui';
import {useAuth} from '../context/AuthContext';
import {fetchProfile, ProfileData} from '../api/profile';
import {apiErrorMessage} from '../api/client';

function InfoRow({label, value}: {label: string; value?: string | null}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const {user, signOut} = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await fetchProfile());
    } catch (e) {
      // silencieux : on affiche au moins les infos de session
      apiErrorMessage(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const fullName = `${data?.firstname ?? user?.firstname ?? ''} ${data?.lastname ?? user?.lastname ?? ''}`.trim();
  const initials = (fullName || 'W').charAt(0).toUpperCase();
  const kycVerified = data?.kyc_status === 'verified';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Profil</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.head}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>
              {fullName || 'Diffuseur'} {kycVerified ? '✅' : ''}
            </Text>
            <Text style={styles.email}>{data?.email ?? user?.email}</Text>
            {data?.is_ambassador && !!data?.ambassador_code && (
              <View style={styles.ambBadge}>
                <Text style={styles.ambText}>Ambassadeur · {data.ambassador_code}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <InfoRow label="Téléphone" value={data?.phone} />
            <InfoRow label="Pays" value={data?.country?.name} />
            <InfoRow label="Ville" value={data?.locality?.name} />
            <InfoRow label="Quartier" value={data?.quartier?.name} />
            <InfoRow label="Profession" value={data?.occupation?.name} />
            <InfoRow
              label="Vues moyennes"
              value={data?.vuesmoyen != null ? String(data.vuesmoyen) : undefined}
            />
            <InfoRow
              label="Taux d'acceptation"
              value={data?.acceptance_rate != null ? `${Math.round(Number(data.acceptance_rate))}%` : undefined}
            />
            <InfoRow
              label="Catégories"
              value={data?.categories?.map(c => c.name).join(', ') || undefined}
            />
          </View>

          <Button title="Se déconnecter" variant="outline" onPress={signOut} style={{marginTop: spacing.xl}} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm},
  scroll: {padding: spacing.lg, paddingBottom: spacing.xxl},
  head: {alignItems: 'center', marginBottom: spacing.xl},
  avatar: {width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md},
  avatarText: {color: colors.textOnPrimary, fontSize: 32, fontWeight: font.weight.bold},
  name: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text},
  email: {fontSize: font.size.sm, color: colors.textMuted, marginTop: 2},
  ambBadge: {marginTop: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs},
  ambText: {color: colors.primaryDark, fontSize: font.size.xs, fontWeight: font.weight.bold},
  card: {backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
  infoLabel: {fontSize: font.size.sm, color: colors.textMuted},
  infoValue: {fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.medium, flexShrink: 1, textAlign: 'right', marginLeft: spacing.md},
});
