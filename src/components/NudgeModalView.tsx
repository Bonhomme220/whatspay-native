import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, font, radius, spacing} from '../theme';
import type {Nudge, NudgeCta} from '../api/nudges';

/** Modal contextuel (incident, annonce importante…) piloté par le NudgeEngine. */
export default function NudgeModalView({
  nudge,
  onClose,
  onCta,
}: {
  nudge: Nudge | null;
  onClose: () => void;
  onCta: (cta: NudgeCta) => void;
}) {
  return (
    <Modal visible={!!nudge} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {!!nudge && (
            <>
              <Text style={styles.title}>{nudge.title}</Text>
              <Text style={styles.message}>{nudge.message}</Text>
              {!!nudge.cta && (
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => {
                    onCta(nudge.cta!);
                    onClose();
                  }}>
                  <Text style={styles.ctaText}>{nudge.cta.label}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.dismiss} onPress={onClose}>
                <Text style={styles.dismissText}>{nudge.dismissible ? 'Plus tard' : 'Fermer'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.xl},
  card: {backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl},
  title: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.sm},
  message: {fontSize: font.size.md, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg},
  cta: {backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center'},
  ctaText: {color: colors.textOnPrimary, fontSize: font.size.md, fontWeight: font.weight.bold},
  dismiss: {alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs},
  dismissText: {color: colors.textMuted, fontSize: font.size.sm, fontWeight: font.weight.medium},
});
