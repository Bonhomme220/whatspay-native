import type {LinkingOptions} from '@react-navigation/native';

/**
 * App Links (app.whatspay.africa) → écrans natifs. Nécessite côté Android
 * l'intent-filter autoVerify dans AndroidManifest.xml + un assetlinks.json
 * valide (SHA-256 du certificat Play Store) pour que le lien ouvre l'appli
 * au lieu du navigateur/PWA.
 *
 * Auth et App sont deux navigateurs distincts montés en alternance par
 * RootNavigator (jamais les deux à la fois) : leurs écrans sont donc listés
 * à plat ici, comme recommandé par React Navigation pour ce pattern.
 */
// Le container est typé sur AppStackParamList (via navigationRef), mais ce fichier liste aussi
// les écrans d'AuthStackParamList — les deux navigateurs s'alternent, jamais montés ensemble
// (cf. RootNavigator). Pas de RootParamList commun déclaré dans ce projet, et la config imbriquée
// de Tabs ne type-check pas sous un générique restreint → `any` assumé ici, même compromis que le
// `@ts-ignore` déjà utilisé dans navigationRef.ts pour la même limite de typage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const linking: LinkingOptions<any> = {
  prefixes: ['https://app.whatspay.africa'],
  config: {
    screens: {
      // Auth
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Reactivation: 'reactivation',
      // App
      Tabs: {
        screens: {
          Accueil: 'dashboard',
          Campagnes: 'campagnes',
          Gains: 'gains',
          Profil: 'profil',
        },
      },
      MissionDetail: 'campagnes/:id',
      SubmitProof: 'campagnes/:id/soumettre',
      Submission: 'campagnes/:id/soumission',
      Ambassador: 'ambassadeur',
      Tickets: 'tickets',
      TicketDetail: 'tickets/:id',
      Settings: 'parametres',
      Complaints: 'reclamations',
      Faq: 'faq',
    },
  },
};
