import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, TextField} from '../components/ui';
import {colors, font, spacing} from '../theme';
import {useAuth} from '../context/AuthContext';
import {apiErrorMessage} from '../api/client';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycUrl, setKycUrl] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setKycUrl(null);
    if (!email.trim() || !password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // La navigation bascule automatiquement (RootNavigator observe l'auth).
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.kyc_required && data?.verify_url) {
        setKycUrl(data.verify_url);
      }
      setError(apiErrorMessage(e, 'Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>W</Text>
            </View>
            <Text style={styles.brand}>WhatsPAY</Text>
            <Text style={styles.subtitle}>Monétise tes Status WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Connexion</Text>

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                {!!kycUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(kycUrl)}>
                    <Text style={styles.kycLink}>Vérifier mon identité ›</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Button title="Se connecter" onPress={submit} loading={loading} style={{marginTop: spacing.sm}} />

            <TouchableOpacity
              style={styles.forgot}
              onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}> Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl},
  header: {alignItems: 'center', marginBottom: spacing.xl},
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {color: colors.textOnPrimary, fontSize: 34, fontWeight: font.weight.bold},
  brand: {fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text},
  subtitle: {fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.xs},
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.lg},
  errorBox: {backgroundColor: colors.dangerSoft, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm},
  errorText: {color: colors.danger, fontSize: font.size.sm},
  kycLink: {color: colors.primary, fontWeight: font.weight.bold, marginTop: spacing.sm},
  forgot: {alignSelf: 'center', marginTop: spacing.lg},
  forgotText: {color: colors.textMuted, fontSize: font.size.sm},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl},
  footerText: {color: colors.textMuted, fontSize: font.size.md},
  footerLink: {color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold},
});
