import React from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/RootNavigator';
import {font, spacing} from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterChoice'>;

const GREEN = '#1ba24b';

export default function RegisterChoiceScreen({navigation}: Props) {
  return (
    <ImageBackground source={require('../assets/login-bg.jpg')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />

            <Text style={styles.title}>Comment souhaitez-vous vous inscrire ?</Text>
            <Text style={styles.subtitle}>Choisissez le type de compte qui vous correspond.</Text>

            <TouchableOpacity
              style={styles.option}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}>
              <Text style={styles.optionIcon}>📱</Text>
              <View style={{flex: 1}}>
                <Text style={styles.optionTitle}>Je suis un diffuseur individuel</Text>
                <Text style={styles.optionText}>
                  Monétisez vos propres Status WhatsApp en diffusant des campagnes.
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => navigation.navigate('RegisterMediaPartner')}
              activeOpacity={0.85}>
              <Text style={styles.optionIcon}>📢</Text>
              <View style={{flex: 1}}>
                <Text style={styles.optionTitle}>Je gère une chaîne WhatsApp</Text>
                <Text style={styles.optionText}>
                  Devenez partenaire média et diffusez du contenu sponsorisé sur votre chaîne.
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Déjà inscrit ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    maxWidth: 420,
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
  logo: {width: 150, height: 48, alignSelf: 'center', marginBottom: 20},
  title: {color: '#1f2937', fontSize: font.size.lg, fontWeight: font.weight.bold, textAlign: 'center', marginBottom: 4},
  subtitle: {color: '#6b7280', fontSize: font.size.sm, textAlign: 'center', marginBottom: 24},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
  },
  optionIcon: {fontSize: 28},
  optionTitle: {color: '#1f2937', fontSize: font.size.md, fontWeight: font.weight.bold, marginBottom: 3},
  optionText: {color: '#6b7280', fontSize: font.size.xs, lineHeight: 16},
  chevron: {color: GREEN, fontSize: 24, fontWeight: font.weight.bold},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: 10},
  footerText: {color: '#6b7280', fontSize: font.size.sm},
  footerLink: {color: GREEN, fontSize: font.size.sm, fontWeight: font.weight.bold},
});
