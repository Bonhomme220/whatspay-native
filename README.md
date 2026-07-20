# WhatsPAY — App mobile (React Native)

Application mobile native (bare React Native CLI + TypeScript) pour les diffuseurs/annonceurs WhatsPAY. Consomme l'API Laravel (Sanctum).

## État actuel

- ✅ Fondations : navigation (native-stack + onglets), thème/design system, client API (axios + Bearer Sanctum), session persistée (AsyncStorage), déconnexion auto sur 401.
- ✅ **Auth** : connexion (KYC requis / compte inactif), mot de passe oublié, **inscription multi-étapes** (identité → localisation → profil de diffusion, auto-login).
- ✅ **Dashboard** : solde, stats, missions récentes, cloche notifications.
- ✅ **Missions** : liste (disponibles/en cours/terminées), détail, accepter, **soumettre une preuve** (capture + vues).
- ✅ **Gains** : solde, cumuls, historique, **retrait** (mobile money / banque).
- ✅ **Ambassadeur** : code partageable, filleuls, activation, saisie de code parrain.
- ✅ **Support** : tickets (liste, détail/fil, création, réponse).
- ✅ **Notifications** : push **natif FCM** (voir ci-dessous) + écran in-app (liste, lu/tout lire).

## Notifications push natives (Firebase FCM)

Le push est **natif** via `@react-native-firebase/messaging` + `@notifee/react-native` (vraies notifications système, foreground/background/quit, tap → navigation, token enregistré sur `POST /fcm-token`).

**Config native requise (à faire une fois) :**
1. Récupérer le **`google-services.json`** du projet Firebase WhatsPAY (celui qu'utilise déjà le backend `FcmService`) et le déposer dans **`android/app/google-services.json`**. *Sans ce fichier, le build Android échoue.*
2. Le plugin Gradle `com.google.gms.google-services` est déjà branché (racine + app), la permission `POST_NOTIFICATIONS` est déclarée, et le background handler est enregistré dans `index.js`.
3. iOS (plus tard, macOS requis) : clé APNs + `GoogleService-Info.plist`.

## Configuration

L'URL de l'API se règle dans [`src/config.ts`](src/config.ts) :

```ts
export const API_BASE_URL = 'https://app.whatspay.africa/api';
```

- Émulateur Android → backend local : `http://10.0.2.2:8000/api`
- Appareil physique → PC local : `http://<IP_DU_PC>:8000/api` (+ autoriser le cleartext HTTP)

## Prérequis pour builder

- Node ≥ 18 (installé : v24)
- **JDK 17** + **Android Studio** (SDK, plateforme, un émulateur ou un appareil) — *non installés pour l'instant sur cette machine*
- (iOS : macOS + Xcode + CocoaPods)

## Lancer

```bash
# 1. Démarrer le bundler
npm start

# 2. Dans un autre terminal — Android (émulateur/appareil branché)
npm run android
```

## Structure

```
src/
  config.ts                     # URL API + clés de stockage
  theme.ts                      # couleurs / espacements / typo
  api/
    client.ts                   # axios + interceptors (token, 401)
    auth.ts                     # login / logout / fcm-token
    dashboard.ts                # GET /dashboard
  context/AuthContext.tsx       # session (bootstrap, signIn, signOut)
  components/ui.tsx             # Button, TextField
  navigation/RootNavigator.tsx  # bascule Auth <-> App selon la session
  screens/                      # Splash, Login, Register, ForgotPassword, Dashboard
```

## Prochaines étapes

- Déposer `google-services.json` puis builder l'APK et tester le flux complet sur appareil.
- Sélecteur de date natif pour la date de naissance (actuellement AAAA-MM-JJ).
- Détail de tracking par mission (clics/vues), réclamations, deep links.
- Espace annonceur (l'API mobile le supporte : briefs, campagnes).
