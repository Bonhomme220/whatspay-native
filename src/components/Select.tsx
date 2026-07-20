import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors, font, radius, spacing} from '../theme';
import type {Ref} from '../api/reference';

export function Select({
  label,
  placeholder = 'Sélectionner…',
  options,
  value,
  onChange,
  disabled,
  loading,
}: {
  label?: string;
  placeholder?: string;
  options: Ref[];
  value?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find(o => o.id === value);
  const filtered = useMemo(
    () => (query ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())) : options),
    [options, query],
  );

  return (
    <View style={{marginBottom: spacing.md}}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.field, disabled && {opacity: 0.5}]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[styles.fieldText, !selected && {color: colors.textMuted}]} numberOfLines={1}>
          {loading ? 'Chargement…' : selected ? selected.name : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{label ?? 'Sélectionner'}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.close}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher…"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={o => o.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onChange(item.id);
                  setQuery('');
                  setOpen(false);
                }}>
                <Text style={[styles.optionText, item.id === value && {color: colors.primary, fontWeight: font.weight.bold}]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Aucun résultat.</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

/** Sélection multiple par « chips ». */
export function MultiSelect({
  label,
  options,
  values,
  onToggle,
  max,
}: {
  label?: string;
  options: Ref[];
  values: string[];
  onToggle: (id: string) => void;
  max?: number;
}) {
  return (
    <View style={{marginBottom: spacing.md}}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {max ? ` (${values.length}/${max})` : ''}
        </Text>
      )}
      <View style={styles.chips}>
        {options.map(o => {
          const active = values.includes(o.id);
          return (
            <TouchableOpacity
              key={o.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(o.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.name}</Text>
            </TouchableOpacity>
          );
        })}
        {options.length === 0 && <Text style={styles.empty}>Chargement…</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: font.weight.medium},
  field: {height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  fieldText: {fontSize: font.size.md, color: colors.text, flex: 1},
  chevron: {color: colors.textMuted, fontSize: font.size.md, marginLeft: spacing.sm},
  modal: {flex: 1, backgroundColor: colors.bg, paddingTop: spacing.xxl},
  modalHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md},
  modalTitle: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text},
  close: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
  search: {marginHorizontal: spacing.lg, height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: font.size.md, color: colors.text, backgroundColor: colors.card, marginBottom: spacing.sm},
  option: {paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
  optionText: {fontSize: font.size.md, color: colors.text},
  empty: {color: colors.textMuted, fontSize: font.size.sm, padding: spacing.lg},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card},
  chipActive: {backgroundColor: colors.primarySoft, borderColor: colors.primary},
  chipText: {fontSize: font.size.sm, color: colors.textMuted},
  chipTextActive: {color: colors.primaryDark, fontWeight: font.weight.bold},
});
