import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from './Icon';
import {font} from '../theme';

/**
 * Pagination simple (précédent / page courante / suivant) pour des listes déjà chargées
 * côté client — pas de rechargement réseau, juste un découpage par tranche de `pageSize`.
 */
export default function Pagination({
  page,
  totalItems,
  pageSize = 10,
  onChange,
}: {
  page: number;
  totalItems: number;
  pageSize?: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, page <= 1 && styles.btnDisabled]}
        onPress={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}>
        <Icon name="chevron-back" size={16} color={page <= 1 ? '#d1d5db' : '#4b5563'} />
      </TouchableOpacity>
      <Text style={styles.label}>Page {page} / {totalPages}</Text>
      <TouchableOpacity
        style={[styles.btn, page >= totalPages && styles.btnDisabled]}
        onPress={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}>
        <Icon name="chevron-forward" size={16} color={page >= totalPages ? '#d1d5db' : '#4b5563'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16},
  btn: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'},
  btnDisabled: {opacity: 0.5},
  label: {color: '#4b5563', fontSize: font.size.xs, fontWeight: font.weight.bold},
});
