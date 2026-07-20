import React, {useState} from 'react';
import {Modal, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {colors, font, radius, spacing} from '../theme';

/** Formate une Date en chaîne locale AAAA-MM-JJ (sans décalage de fuseau). */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromYMD(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function labelFr(s?: string): string | null {
  const d = fromYMD(s);
  if (!d) return null;
  return d.toLocaleDateString('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'});
}

/**
 * Champ de sélection de date natif (dialog Android / spinner iOS).
 * `value` et `onChange` utilisent le format AAAA-MM-JJ.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  maximumDate,
  minimumDate,
}: {
  label?: string;
  value?: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  // Date affichée dans le picker (valeur courante, sinon la date max, sinon aujourd'hui)
  const initial = fromYMD(value) ?? maximumDate ?? new Date();
  const [temp, setTemp] = useState<Date>(initial);

  const openPicker = () => {
    setTemp(fromYMD(value) ?? maximumDate ?? new Date());
    setShow(true);
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (event.type === 'set' && date) {
      onChange(toYMD(date));
    }
  };

  const display = labelFr(value);

  return (
    <View style={{marginBottom: spacing.md}}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.field} onPress={openPicker} activeOpacity={0.8}>
        <Text style={[styles.fieldText, !display && {color: colors.textMuted}]}>
          {display ?? placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      {/* Android : dialog natif auto-dismiss */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={initial}
          mode="date"
          display="calendar"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={onAndroidChange}
        />
      )}

      {/* iOS : spinner dans une modale avec bouton Valider */}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={styles.iosBackdrop}>
            <View style={styles.iosSheet}>
              <View style={styles.iosBar}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.iosCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onChange(toYMD(temp));
                    setShow(false);
                  }}>
                  <Text style={styles.iosDone}>Valider</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={temp}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={(_e, d) => d && setTemp(d)}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: font.weight.medium},
  field: {height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  fieldText: {fontSize: font.size.md, color: colors.text, flex: 1},
  icon: {fontSize: font.size.md, marginLeft: spacing.sm},
  iosBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)'},
  iosSheet: {backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: spacing.xl},
  iosBar: {flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
  iosCancel: {color: colors.textMuted, fontSize: font.size.md},
  iosDone: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
});
