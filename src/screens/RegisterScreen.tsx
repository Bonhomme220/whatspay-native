import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, font, radius, spacing} from '../theme';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

/**
 * Amorce de l'inscription. L'inscription complète est un parcours multi-étapes
 * (identité → localisation → profil de diffusion : catégories, types de contenu,
 * vues moyennes, etc.) qui consomme les endpoints de référence
 * (/countries, /localities, /categories, /contenttypes, /langs, /studies).
 * À construire au prochain jet.
 */
export default function RegisterScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Bientôt</Text>
        </View>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>
          Le parcours d'inscription (identité, localisation, profil de diffusion) sera ajouté au
          prochain jet. En attendant, connecte-toi avec un compte existant.
        </Text>

        <View style={styles.steps}>
          {['Identité & mot de passe', 'Localisation (pays, ville, quartier)', 'Profil de diffusion (catégories, types de contenu, vues moyennes)'].map(
            (s, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ),
          )}
        </View>

        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Retour à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl},
  badge: {alignSelf: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.md},
  badgeText: {color: colors.warning, fontSize: font.size.xs, fontWeight: font.weight.bold},
  title: {fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text},
  subtitle: {fontSize: font.size.md, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 22},
  steps: {gap: spacing.md},
  step: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border},
  stepNum: {width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md},
  stepNumText: {color: colors.primaryDark, fontWeight: font.weight.bold},
  stepText: {flex: 1, fontSize: font.size.sm, color: colors.text},
  back: {alignSelf: 'center', marginTop: spacing.xl},
  backText: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
});
