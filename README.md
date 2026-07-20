# WhatsPAY — App mobile (React Native)

Application mobile native (bare React Native CLI + TypeScript) pour les diffuseurs/annonceurs WhatsPAY. Consomme l'API Laravel (Sanctum).

## État actuel (1er jet)

- ✅ Fondations : navigation (React Navigation, native-stack), thème/design system, client API (axios + Bearer Sanctum), session persistée (AsyncStorage), déconnexion auto sur 401.
- ✅ **Auth** : écran de connexion (avec gestion KYC requis / compte inactif), mot de passe oublié.
- ✅ **Dashboard** : solde, stats (en cours, fiabilité), missions récentes, pull-to-refresh.
- 🚧 **Inscription** : amorce (le parcours multi-étapes complet arrive au prochain jet).

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

- Inscription multi-étapes (identité → localisation → profil de diffusion).
- Onglets (missions, gains, profil), détail de mission + soumission de preuve (caméra).
- Push FCM (enregistrement du token via `POST /fcm-token`).
- Retraits, ambassadeur, tickets, notifications.
