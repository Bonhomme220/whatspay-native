import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Select} from './Select';
import Icon from './Icon';
import {fetchProfile, updateLocation} from '../api/profile';
import {fetchArrondissements, fetchQuartiers, Ref} from '../api/reference';
import {font} from '../theme';

const GREEN = '#16a34a';

/**
 * Modal non-dismissible : demande arrondissement + quartier quand l'adresse
 * n'est pas confirmée (location_confirmed_at nul) et que la localité a des
 * arrondissements. Sinon ne s'affiche pas.
 */
export default function LocationUpdateModal() {
  const [visible, setVisible] = useState(false);
  const [arrs, setArrs] = useState<Ref[]>([]);
  const [quartiers, setQuartiers] = useState<Ref[]>([]);
  const [arrId, setArrId] = useState('');
  const [quartierId, setQuartierId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p: any = await fetchProfile();
        if (p.location_confirmed_at || !p.locality?.id) return;
        const a = await fetchArrondissements(p.locality.id);
        if (!a.length) return; // pas d'arrondissements (certains pays) → skip
        setArrs(a);
        setVisible(true);
      } catch {
        // réseau : ne pas bloquer
      }
    })();
  }, []);

  useEffect(() => {
    if (arrId) fetchQuartiers(arrId).then(setQuartiers).catch(() => setQuartiers([]));
    else setQuartiers([]);
  }, [arrId]);

  const submit = async () => {
    if (!arrId || !quartierId) {
      setError('Veuillez sélectionner votre arrondissement et votre quartier.');
      return;
    }
    setBusy(true);
    try {
      await updateLocation(arrId, quartierId);
      setVisible(false);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}><Icon name="location" size={26} color="#fff" /></View>
          <Text style={styles.title}>Mettez votre adresse à jour</Text>
          <Text style={styles.sub}>Pour recevoir des campagnes ciblées près de chez vous, précisez votre arrondissement et votre quartier.</Text>
          <View style={{alignSelf: 'stretch', marginTop: 16}}>
            <Select label="Arrondissement" options={arrs} value={arrId} onChange={v => {setArrId(v); setQuartierId(''); setError(null);}} />
            <Select label="Quartier" options={quartiers} value={quartierId} onChange={v => {setQuartierId(v); setError(null);}} disabled={!arrId} />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={[styles.cta, busy && {opacity: 0.6}]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24},
  card: {backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center'},
  iconWrap: {width: 56, height: 56, borderRadius: 16, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  title: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold, textAlign: 'center'},
  sub: {color: '#6b7280', fontSize: font.size.sm, textAlign: 'center', marginTop: 6, lineHeight: 20},
  error: {color: '#dc2626', fontSize: font.size.xs, marginTop: 8, alignSelf: 'flex-start'},
  cta: {alignSelf: 'stretch', backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 8},
  ctaText: {color: '#fff', fontSize: font.size.sm, fontWeight: font.weight.bold},
});
