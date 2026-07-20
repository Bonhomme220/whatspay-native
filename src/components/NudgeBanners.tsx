import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, font, radius, spacing} from '../theme';
import type {Nudge, NudgeCta, NudgeType} from '../api/nudges';

// Priorité d'affichage : plus le poids est faible, plus la bannière est haute.
const PRIORITY: Record<NudgeType, number> = {
  critical: 0,
  high: 1,
  ambassador: 2,
  normal: 3,
};

function palette(type: NudgeType) {
  switch (type) {
    case 'critical':
      return {bg: '#fef2f2', border: '#fecaca', accent: colors.danger, icon: '🚨'};
    case 'high':
      return {bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', icon: '🔔'};
    case 'ambassador':
      return {bg: '#fefce8', border: '#fde68a', accent: '#ca8a04', icon: '⭐'};
    default:
      return {bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', icon: 'ℹ️'};
  }
}

function BannerCard({
  nudge,
  onDismiss,
  onCta,
}: {
  nudge: Nudge;
  onDismiss: (id: string) => void;
  onCta: (cta: NudgeCta) => void;
}) {
  const p = palette(nudge.type);
  return (
    <View style={[styles.card, {backgroundColor: p.bg, borderColor: p.border}]}>
      <Text style={styles.icon}>{p.icon}</Text>
      <View style={{flex: 1}}>
        <Text style={styles.title}>{nudge.title}</Text>
        <Text style={styles.message}>{nudge.message}</Text>
        {!!nudge.cta && (
          <TouchableOpacity
            style={[styles.cta, {backgroundColor: p.accent}]}
            onPress={() => onCta(nudge.cta!)}>
            <Text style={styles.ctaText}>{nudge.cta.label} ›</Text>
          </TouchableOpacity>
        )}
      </View>
      {nudge.dismissible && (
        <TouchableOpacity onPress={() => onDismiss(nudge.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={[styles.close, {color: p.accent}]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function NudgeBanners({
  banners,
  onDismiss,
  onCta,
}: {
  banners: Nudge[];
  onDismiss: (id: string) => void;
  onCta: (cta: NudgeCta) => void;
}) {
  if (!banners || banners.length === 0) return null;

  // Tri stable par priorité (l'ordre serveur est conservé à priorité égale).
  const sorted = banners
    .map((b, i) => ({b, i}))
    .sort((a, z) => (PRIORITY[a.b.type] ?? 9) - (PRIORITY[z.b.type] ?? 9) || a.i - z.i)
    .map(x => x.b);

  return (
    <View style={styles.wrap}>
      {sorted.map(b => (
        <BannerCard key={b.id} nudge={b} onDismiss={onDismiss} onCta={onCta} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginBottom: spacing.md},
  card: {flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm},
  icon: {fontSize: 20, marginTop: 1},
  title: {fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.text},
  message: {fontSize: font.size.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18},
  cta: {alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm},
  ctaText: {color: colors.textOnPrimary, fontSize: font.size.xs, fontWeight: font.weight.bold},
  close: {fontSize: font.size.md, fontWeight: font.weight.bold, paddingLeft: spacing.xs},
});
