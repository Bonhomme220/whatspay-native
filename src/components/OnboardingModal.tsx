import React, {useEffect, useState} from 'react';
import {Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, font, radius, spacing} from '../theme';
import {completeOnboarding, fetchProfile} from '../api/profile';
import {markChannelJoined, markChannelShown} from '../api/kyc';
import {WHATSAPP_CHANNEL_URL} from '../config';
import Icon from './Icon';

const STEPS = [
  {icon: '🎯', title: 'Reçois des campagnes', text: 'Des missions adaptées à ton profil te sont proposées régulièrement.'},
  {icon: '📲', title: 'Diffuse sur ton Status', text: 'Publie le contenu sur ton Status WhatsApp et prouve tes vues.'},
  {icon: '💰', title: 'Gagne et retire', text: 'Tes gains s’accumulent — retire-les en Mobile Money ou par virement.'},
];

/**
 * Modal d'accueil affiché une seule fois (flag onboarding_shown_at côté serveur).
 * Enchaîne immédiatement sur un modal « Rejoindre la chaîne WhatsApp » pour les nouveaux
 * utilisateurs qui ne l'ont pas encore rejointe — c'est le moment le plus fiable pour les
 * y rediriger, avant qu'ils ne quittent l'app.
 */
export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [waVisible, setWaVisible] = useState(false);
  const [waJoined, setWaJoined] = useState(true); // true par défaut : évite un flash avant chargement

  useEffect(() => {
    fetchProfile()
      .then(p => {
        if (!p.onboarding_shown_at) setVisible(true);
        setWaJoined(!!p.whatsapp_channel_joined);
      })
      .catch(() => {});
  }, []);

  const finish = () => {
    setVisible(false);
    completeOnboarding().catch(() => {});
    if (!waJoined) {
      markChannelShown().catch(() => {});
      setWaVisible(true);
    }
  };

  const joinChannel = () => {
    markChannelJoined().catch(() => {});
    Linking.openURL(WHATSAPP_CHANNEL_URL);
    setWaVisible(false);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.welcome}>Bienvenue 👋</Text>
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

      <Modal visible={waVisible} transparent animationType="fade" onRequestClose={() => setWaVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.waIconWrap}><Icon name="logo-whatsapp" size={32} color="#fff" /></View>
            <Text style={styles.welcome}>Rejoins notre chaîne WhatsApp</Text>
            <Text style={styles.sub}>Reçois les nouvelles campagnes, astuces et annonces officielles en temps réel — ne rate aucune opportunité de gagner.</Text>

            <TouchableOpacity style={styles.btn} onPress={joinChannel}>
              <Text style={styles.btnText}>Rejoindre la chaîne</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => setWaVisible(false)}>
              <Text style={styles.skipText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl},
  card: {backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl},
  logo: {width: 180, height: 60, alignSelf: 'center', marginBottom: spacing.md},
  welcome: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, textAlign: 'center'},
  sub: {fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg},
  steps: {gap: spacing.md, marginBottom: spacing.lg},
  step: {flexDirection: 'row', gap: spacing.md, alignItems: 'center'},
  stepIcon: {fontSize: 26},
  stepTitle: {fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text},
  stepText: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18},
  btn: {backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center'},
  btnText: {color: colors.textOnPrimary, fontSize: font.size.md, fontWeight: font.weight.bold},
  waIconWrap: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md},
  skipBtn: {alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs},
  skipText: {color: colors.textMuted, fontSize: font.size.sm, fontWeight: font.weight.bold},
});
