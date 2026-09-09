import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../navigation/RootNavigator';
import {colors, font, radius, spacing} from '../theme';

/**
 * Modal d'annonce du barème dégressif — affiché 1x/jour aux diffuseurs déjà inscrits
 * avant l'activation, pendant leur fenêtre de grâce de 30 jours (taux plat garanti).
 * Mirror de OnboardingModal pour le style, mais standalone : pilotée par le parent
 * (DashboardScreen) qui a déjà chargé /dashboard et sait quand l'afficher.
 */
export default function TieredPayoutNoticeModal({
  visible,
  daysLeft,
  graceEndDate,
  onClose,
}: {
  visible: boolean;
  daysLeft?: number;
  graceEndDate?: string;
  onClose: () => void;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const dateLabel = graceEndDate ? new Date(graceEndDate).toLocaleDateString('fr-FR') : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}><Text style={styles.icon}>📊</Text></View>
          <Text style={styles.title}>Le tarif par vue évolue bientôt</Text>
          <Text style={styles.sub}>
            Un nouveau barème de paiement par palier entre en vigueur pour vous le{' '}
            <Text style={styles.bold}>{dateLabel}</Text>
            {typeof daysLeft === 'number' ? ` (dans ${daysLeft} j)` : ''}. D'ici là, votre tarif actuel reste inchangé.
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              onClose();
              navigation.navigate('Faq');
            }}>
            <Text style={styles.btnText}>Voir la FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl},
  card: {backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl},
  iconWrap: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md},
  icon: {fontSize: 28},
  title: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, textAlign: 'center'},
  sub: {fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20},
  bold: {fontWeight: font.weight.bold, color: colors.text},
  btn: {backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center'},
  btnText: {color: colors.textOnPrimary, fontSize: font.size.md, fontWeight: font.weight.bold},
  skipBtn: {alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs},
  skipText: {color: colors.textMuted, fontSize: font.size.sm, fontWeight: font.weight.bold},
});
