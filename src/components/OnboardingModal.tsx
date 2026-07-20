import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, font, radius, spacing} from '../theme';
import {completeOnboarding, fetchProfile} from '../api/profile';

const STEPS = [
  {icon: '🎯', title: 'Reçois des campagnes', text: 'Des missions adaptées à ton profil te sont proposées régulièrement.'},
  {icon: '📲', title: 'Diffuse sur ton Status', text: 'Publie le contenu sur ton Status WhatsApp et prouve tes vues.'},
  {icon: '💰', title: 'Gagne et retire', text: 'Tes gains s’accumulent — retire-les en Mobile Money ou par virement.'},
];

/** Modal d'accueil affiché une seule fois (flag onboarding_shown_at côté serveur). */
export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then(p => {
        if (!p.onboarding_shown_at) setVisible(true);
      })
      .catch(() => {});
  }, []);

  const finish = () => {
    setVisible(false);
    completeOnboarding().catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <Text style={styles.welcome}>Bienvenue sur WhatsPAY 👋</Text>
          <Text style={styles.sub}>Monétise tes Status WhatsApp en 3 étapes :</Text>

          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepIcon}>{s.icon}</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={finish}>
            <Text style={styles.btnText}>C’est parti</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl},
  card: {backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl},
  logo: {width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md},
  logoText: {color: colors.textOnPrimary, fontSize: 28, fontWeight: font.weight.bold},
  welcome: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, textAlign: 'center'},
  sub: {fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg},
  steps: {gap: spacing.md, marginBottom: spacing.lg},
  step: {flexDirection: 'row', gap: spacing.md, alignItems: 'center'},
  stepIcon: {fontSize: 26},
  stepTitle: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text},
  stepText: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18},
  btn: {backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center'},
  btnText: {color: colors.textOnPrimary, fontSize: font.size.md, fontWeight: font.weight.bold},
});
