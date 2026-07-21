import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, font, radius, spacing} from '../theme';
import {useAuth} from '../context/AuthContext';
import {apiErrorMessage} from '../api/client';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const INPUT_BG = 'rgba(43,94,94,0.1)';
const GREEN = '#1ba24b';

export default function LoginScreen({navigation}: Props) {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
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
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.kyc_required && data?.verify_url) {
        setKycUrl(data.verify_url);
      }
      if (data?.inactive) {
        navigation.navigate('Reactivation', {email: email.trim()});
        return;
      }
      setError(apiErrorMessage(e, 'Identifiants incorrects.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/login-bg.jpg')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              {/* Logo */}
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />

              {/* Erreur */}
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

              <Text style={styles.title}>Connectez vous</Text>
              <Text style={styles.subtitle}>Entrez vos identifiants pour vous connecter</Text>

              {/* Email */}
              <Text style={styles.label}>Adresse mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@mail.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              {/* Mot de passe */}
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.pwdWrap}>
                <TextInput
                  style={[styles.input, {paddingRight: 44, marginBottom: 0}]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="*********"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPwd}
                />
                <TouchableOpacity
                  style={styles.eye}
                  onPress={() => setShowPwd(v => !v)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.eyeIcon}>{showPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Remember + oublié */}
              <View style={styles.row}>
                <TouchableOpacity style={styles.remember} onPress={() => setRemember(v => !v)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                    {remember && <Text style={styles.check}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Souvenez-vous de moi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgot}>Mot de passe oublié?</Text>
                </TouchableOpacity>
              </View>

              {/* Bouton */}
              <TouchableOpacity
                style={[styles.btn, loading && {opacity: 0.6}]}
                onPress={submit}
                disabled={loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Connexion</Text>
                )}
              </TouchableOpacity>

              {/* Inscription */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Pas inscrit(e)? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Inscrivez vous</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {flex: 1},
  safe: {flex: 1},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: spacing.lg},
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: '#081542',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  logo: {width: 170, height: 54, alignSelf: 'center', marginBottom: 24},
  errorBox: {marginBottom: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2', paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
  errorText: {color: '#dc2626', fontSize: font.size.sm},
  kycLink: {color: GREEN, fontWeight: font.weight.bold, marginTop: spacing.xs},
  title: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold, marginBottom: 2},
  subtitle: {color: '#6b7280', fontSize: font.size.sm, marginBottom: 20},
  label: {color: '#374151', fontSize: font.size.sm, fontWeight: font.weight.medium, marginBottom: 6},
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: font.size.sm,
    color: '#1f2937',
    marginBottom: 16,
  },
  pwdWrap: {position: 'relative', justifyContent: 'center', marginBottom: 16},
  eye: {position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center'},
  eyeIcon: {fontSize: 18},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, marginTop: 2},
  remember: {flexDirection: 'row', alignItems: 'center'},
  checkbox: {width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center', marginRight: 8},
  checkboxOn: {backgroundColor: GREEN, borderColor: GREEN},
  check: {color: '#fff', fontSize: 12, fontWeight: font.weight.bold},
  rememberText: {color: '#6b7280', fontSize: font.size.sm},
  forgot: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.medium},
  btn: {backgroundColor: GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center'},
  btnText: {color: '#fff', fontSize: font.size.md, fontWeight: font.weight.bold},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: 20},
  footerText: {color: '#6b7280', fontSize: font.size.sm},
  footerLink: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
});
