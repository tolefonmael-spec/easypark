# Easy Park — Application Mobile (Expo SDK 54)

## Structure du projet

```
easypark-expo/
├── App.tsx                          # Point d'entrée
├── app.json                         # Config Expo
├── package.json
├── tsconfig.json
├── .env                             # Credentials Supabase
└── src/
    ├── constants/
    │   └── theme.ts                 # Couleurs, polices, tokens
    ├── types/
    │   └── index.ts                 # Types TypeScript
    ├── services/
    │   ├── supabase.ts              # Client Supabase
    │   ├── auth.ts                  # Authentification
    │   └── spots.ts                 # CRUD places + upload photo
    ├── hooks/
    │   ├── useAuth.ts               # Session + profil
    │   ├── useLocation.ts           # GPS watchPosition
    │   └── useSpots.ts              # Places + realtime + timer
    ├── components/
    │   ├── UI.tsx                   # Composants partagés
    │   └── SpotCard.tsx             # Carte de place
    ├── screens/
    │   ├── MapScreen.tsx            # Carte + liste des places
    │   ├── ReportScreen.tsx         # Formulaire signalement
    │   ├── ProfileScreen.tsx        # Profil + badges + historique
    │   ├── LeaderboardScreen.tsx    # Classement
    │   └── AuthScreen.tsx           # Login + inscription
    └── navigation/
        └── AppNavigator.tsx         # Navigation tabs + stack
```

---

## Installation et lancement

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI : `npm install -g expo-cli`
- Expo Go sur votre téléphone (iOS ou Android)

### Étapes

```bash
# 1. Installer les dépendances
cd easypark-expo
npm install

# 2. Lancer l'app
npx expo start

# 3. Scanner le QR code avec Expo Go
```

---

## Configuration Supabase

### SQL à exécuter (une seule fois)
Exécutez `schema.sql` dans Supabase → SQL Editor → New query → Run.

### Désactiver la confirmation email
Supabase → Authentication → Providers → Email → désactivez "Confirm email"

### Variables d'environnement
Les credentials sont déjà dans `.env` et `app.json`.

---

## Fonctionnalités

| Écran         | Fonctionnalité |
|---------------|----------------|
| 🗺️ Carte      | Liste des places à 1 km, filtres, vue carte/liste, détail, naviguer, déclarer occupée |
| 📍 Signaler   | GPS auto, photo, statut, type, payant/gratuit, "bientôt libre" avec timer |
| 🏆 Classement | Top contributeurs, stats communautaires |
| 👤 Profil     | Points, badges, historique, niveau |

---

## Build production

```bash
# Android APK
npx expo build:android

# iOS (nécessite un compte Apple Developer)
npx expo build:ios

# Avec EAS Build (recommandé)
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```
