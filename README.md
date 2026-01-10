# 🍔 Good Food - Application Client

Application mobile React Native pour la commande de nourriture en ligne, migrée de Firebase vers une architecture API personnalisée avec Express.js et MongoDB.

## 📋 Table des Matières

- [🚀 Fonctionnalités](#-fonctionnalités)
- [🛠️ Technologies](#️-technologies)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🔄 Migration Firebase → API](#-migration-firebase--api)
- [🗄️ Structure du Projet](#️-structure-du-projet)
- [🌐 API Endpoints](#-api-endpoints)
- [🎭 Mode Démo](#-mode-démo)
- [🌍 Internationalisation](#-internationalisation)
- [📚 Documentation Détaillée](#-documentation-détaillée)
- [📱 Utilisation](#-utilisation)
- [🐛 Dépannage](#-dépannage)

## 🚀 Fonctionnalités

- ✅ Authentification utilisateur (inscription/connexion)
- ✅ Recherche et découverte de restaurants
- ✅ Consultation des menus et plats
- ✅ Gestion du panier
- ✅ Passation de commandes
- ✅ Suivi des commandes
- ✅ Géolocalisation et cartes
- ✅ Paiement et portefeuille
- ✅ Interface multilingue (FR/EN)
- ✅ **Mode démonstration** (connexion automatique)

## 🛠️ Technologies

### Frontend (React Native)
- **React Native** 0.81.5
- **Expo** ~54.0.0
- **React Navigation** v6+ (Stack, Tab, Drawer)
- **React Native Reanimated** ~4.1.1 (v3+)
- **Redux** (gestion d'état)
- **AsyncStorage** (persistance locale)

### Backend (Express.js + MongoDB)
- **Node.js** + Express
- **MongoDB** (base de données)
- **JWT** (authentification)
- **Bcrypt** (hashage mots de passe)

### Autres
- **Firebase** → **REMPLACÉ** par API REST
- **Axios/Fetch** (requêtes HTTP)
- **Expo Location** (géolocalisation)
- **Expo Linear Gradient** (dégradés)

## 📦 Installation

### Prérequis
- Node.js ≥ 16
- npm ou yarn
- Expo CLI
- Android Studio (pour Android) ou Xcode (pour iOS)

### Installation des dépendances
```bash
# Cloner le projet
git clone <repository-url>
cd customer-app

# Installer les dépendances
npm install

# Installer les dépendances supplémentaires si nécessaire
npm install @react-native-async-storage/async-storage
```

### Configuration du Backend
1. **Installer et configurer votre serveur Express + MongoDB**
2. **Créer la base de données MongoDB** avec les collections :
   - `users`
   - `restaurants`
   - `categories`
   - `orders`
   - `drivers`

## ⚙️ Configuration

### Configuration de l'API
Modifiez le fichier `config.js` :

```javascript
export const config = {
  // URL de votre serveur Express/MongoDB
  API_BASE_URL: 'http://localhost:3000/api', // ⚠️ À MODIFIER !

  APP_NAME: 'Good Food',
  VERSION: '1.0.0',
  API_TIMEOUT: 10000,
};
```

### Variables d'environnement (optionnel)
Créer un fichier `.env` :
```env
API_BASE_URL=http://your-server-url:port/api
```

## 🔄 Migration Firebase → API

### ❌ Ce qui a été supprimé :
- **firebase.js** - Fichier Firebase complet supprimé
- Toutes les références à `firebase/auth`, `firebase/firestore`, `firebase/storage`
- Dépendance `react-navigation` v4 (conflits)

### ✅ Ce qui a été ajouté/créé :
- **`api.js`** - Client API REST complet
- **`config.js`** - Configuration centralisée
- Architecture API propre avec gestion d'erreurs

### 🔄 Ce qui a été migré :
| Fonctionnalité | Avant (Firebase) | Après (API) |
|---|---|---|
| Authentification | `signInWithEmailAndPassword` | `api.login(email, password)` |
| Utilisateurs | `userInfos(uid)` | `api.getUserInfo(userId)` |
| Restaurants | `getRestaurantsFromFirebase()` | `api.getRestaurants()` |
| Commandes | `addDoc(ordersCol, {...})` | `api.createOrder(orderData)` |
| Catégories | `getCategories()` | `api.getCategories()` |

## 🗄️ Structure du Projet

```
customer-app/
├── 📁 android/           # Configuration Android
├── 📁 ios/              # Configuration iOS
├── 📁 assets/           # Images, animations, polices
├── 📁 components/       # Composants réutilisables
│   ├── 📁 home/        # Composants page d'accueil
│   └── 📁 restaurantDetail/ # Composants détail restaurant
├── 📁 contexts/         # Contextes React (Auth, Loader, etc.)
├── 📁 lang/            # Fichiers de traduction
├── 📁 navigation/      # Configuration React Navigation
├── 📁 redux/           # Store Redux et reducers
├── 📁 screens/         # Écrans de l'application
├── 📁 storybook/       # Configuration Storybook
├── 📄 api.js           # Client API REST (NOUVEAU)
├── 📄 config.js        # Configuration (NOUVEAU)
├── 📄 App.js           # Point d'entrée
└── 📄 package.json     # Dépendances
```

## 🌐 API Endpoints

Votre serveur Express doit implémenter ces endpoints :

### Authentification
```javascript
POST   /api/auth/login       // Connexion
POST   /api/auth/register    // Inscription
```

### Utilisateurs
```javascript
GET    /api/users/:id        // Infos utilisateur
PUT    /api/users/:id        // Mise à jour utilisateur
```

### Restaurants & Menus
```javascript
GET    /api/restaurants      // Liste restaurants
GET    /api/restaurants/:id  // Détail restaurant
GET    /api/restaurants/:id/foods // Menu du restaurant
```

### Catégories
```javascript
GET    /api/categories       // Liste catégories
```

### Commandes
```javascript
POST   /api/orders           // Créer commande
GET    /api/orders           // Liste commandes utilisateur
GET    /api/orders/:id       // Détail commande
```

### Drivers
```javascript
GET    /api/drivers/:id      // Infos driver
```

### Format des données

#### Utilisateur
```json
{
  "_id": "string",
  "email": "string",
  "name": "string",
  "phone": "string",
  "address": "string",
  "lat": "number",
  "lng": "number"
}
```

#### Restaurant
```json
{
  "_id": "string",
  "name": "string",
  "address": "string",
  "lat": "number",
  "lng": "number",
  "phone": "string",
  "categories": ["string"],
  "dishes": [{
    "title": "string",
    "price": "number",
    "description": "string",
    "image": "string"
  }]
}
```

#### Commande
```json
{
  "_id": "string",
  "orderId": "string",
  "user": {
    "id": "string",
    "name": "string",
    "phone": "string",
    "address": "string",
    "lat": "number",
    "lng": "number"
  },
  "restaurant": {
    "id": "string",
    "name": "string",
    "address": "string",
    "lat": "number",
    "lng": "number",
    "phone": "string"
  },
  "items": [{
    "name": "string",
    "price": "number",
    "quantity": "number"
  }],
  "status": "pending|accepted|preparing|ready|delivered",
  "total": "number",
  "createdAt": "ISO string"
}
```

## 🎭 Mode Démo

### Configuration
Le mode démonstration permet de préremplir automatiquement les identifiants de connexion pour faciliter les démonstrations.

**Activation** : Dans `config.js`, mettez `DEMO_MODE: true`

**Identifiants de démo** :
- **Email** : `demo@customer.com`
- **Mot de passe** : `demo123`

### Fonctionnement
- ✅ Champs de connexion préremplis automatiquement
- ✅ Indicateur visuel "Mode Démo - Identifiants préremplis"
- ✅ Connexion en un clic
- ✅ Utilisateur de démo créé automatiquement dans la base de données

### Création de l'utilisateur de démo
```bash
# Dans le backend
npm run migrate:up -- 20250303223322-add-user.js
# ou
./run-migrations-ordered.sh
```

## 🌍 Internationalisation

L'application supporte plusieurs langues avec un système d'internationalisation complet.

### Configuration
- **Langue par défaut :** Anglais 🇬🇧
- **Détection automatique :** Langue du device
- **Support :** Français 🇫🇷, Anglais 🇬🇧

### Structure
```
lang/
├── en.json    # Traductions anglaises
└── fr.json    # Traductions françaises
```

### Utilisation dans le code
```javascript
import i18n from '../i18n';

// Texte simple
<Text>{i18n.t('auth.welcome')}</Text>

// Avec paramètres
<Text>{i18n.t('order.estimatedTime', { minutes: 25 })}</Text>
```

### Changement de langue
```javascript
import { changeLanguage } from '../i18n';
changeLanguage('en'); // Anglais
changeLanguage('fr'); // Français
```

### Écrans internationalisés
- ✅ **SignIn** - Connexion avec mode démo
- 🔄 **SignUp** - Inscription (à faire)
- 🔄 **Home** - Accueil (à faire)
- 🔄 **RestaurantDetail** - Détails (à faire)
- 🔄 **Cart** - Panier (à faire)
- 🔄 **Profile** - Profil (à faire)
- 🔄 **Settings** - Paramètres (à faire)

## 📚 Documentation Détaillée

Pour consulter l'historique complet des mises à jour et les guides détaillés :

📁 **[`/doc`](./doc/)** - Documentation organized by date

### Available files:
- **[2025-01-updates.md](./doc/2025-01-updates.md)** - All January 2025 updates
- **[migration-api-firebase.md](./doc/migration-api-firebase.md)** - Firebase → REST API migration

Chaque fichier contient :
- ✅ Modifications détaillées
- 🐛 Problèmes résolus
- 📋 Instructions complètes
- 🔍 Vérifications post-déploiement

## 📱 Utilisation

### Démarrage de l'application
```bash
# Mode développement
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Flux utilisateur
1. **Onboarding** → Écran d'accueil
2. **SignIn/SignUp** → Authentification
3. **Home** → Découverte restaurants
4. **RestaurantDetail** → Consultation menu
5. **Cart/Checkout** → Validation commande
6. **OrderTracking** → Suivi commande

## 🐛 Dépannage

### Erreur "component auth has not been registered"
**Cause** : Références Firebase restantes
**Solution** : Vérifiez que `firebase.js` est supprimé et tous les imports Firebase nettoyés

### Erreur "Network request failed"
**Cause** : Serveur API non accessible
**Solution** : Vérifiez l'URL dans `config.js` et que votre serveur tourne

### Bouton "Continue" ne fonctionne pas
**Cause** : Ancien code avec setTimeout
**Solution** : Vérifiez que `Onboarding.js` n'a plus de splash state

### AsyncStorage dupliqué
**Cause** : Imports multiples
**Solution** : Supprimer les imports dupliqués dans SignIn.js

### Erreur "useLegacyImplementation" prop
**Cause** : Conflit entre React Navigation v6 et Reanimated v3+
**Solution** :
```bash
# Option 1 : Upgrade React Navigation (recommandé)
npm uninstall @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/drawer
npm install @react-navigation/native@^7.0.0 @react-navigation/stack@^7.0.0 @react-navigation/bottom-tabs@^7.0.0 @react-navigation/drawer@^7.0.0

# Option 2 : Downgrade Reanimated (temporaire)
npm install react-native-reanimated@~2.14.0

# Nettoyer le cache
npx expo start --clear
```

### Erreur 404 sur /users/:id
**Cause** : Route utilisateur manquante dans l'API
**Solution** : Ajouter la route dans `src/routes/userRoutes.js` :
```javascript
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
});
```

### Mode démo non fonctionnel
**Cause** : Utilisateur de démo non créé ou identifiants incorrects
**Solution** :
1. Vérifier que les migrations ont été exécutées
2. Vérifier `config.js` : `DEMO_MODE: true`
3. Vérifier les identifiants dans `config.js`
4. Redémarrer l'app avec `npx expo start --clear`

### Erreur "cannot read property split of undefined"
**Cause** : `Localization.locale` undefined dans i18n.js
**Solution** : Gestion d'erreur ajoutée dans `i18n.js` :
```javascript
let deviceLanguage = 'fr'; // Défaut français
try {
  if (Localization && Localization.locale) {
    deviceLanguage = Localization.locale.split('-')[0];
  }
} catch (error) {
  console.warn('Erreur lors de la détection de langue:', error.message);
}
```

## 📝 Scripts Disponibles

```bash
npm start          # Démarre Expo DevTools
npm run android    # Build et lance sur Android
npm run ios        # Build et lance sur iOS
npm run web        # Lance en mode web
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

---

## 🔄 Historique des Changements

📁 **Documentation détaillée disponible dans** [`/doc`](./doc/)

### v2.2.0 (2025-01-10) - Internationalisation + Corrections
- ✅ **Système d'internationalisation complet** (i18n-js + expo-localization)
- ✅ **Support multilingue** Français 🇫🇷 et Anglais 🇬🇧
- ✅ **Détection automatique** de la langue du device
- ✅ **Écran SignIn internationalisé** (premier écran terminé)
- ✅ **Langue par défaut** changée à Anglais 🇬🇧
- ✅ **Correction erreur** `cannot read property split of undefined`
- ✅ **Gestion robuste** de la détection de langue avec fallback
- ✅ **Structure de traductions** organisée et extensible

### v2.1.0 (2025-01-09) - Mode Démo + Corrections
- ✅ Mode démonstration avec connexion automatique
- ✅ Résolution conflits React Navigation / Reanimated
- ✅ Utilisateur de démo et route API ajoutés

### v2.0.0 - Migration Firebase → API
- ✅ Migration complète vers API REST personnalisée
- ✅ Suppression dépendances Firebase
- ✅ Authentification JWT + MongoDB

### v1.0.0 (Original)
- Application avec Firebase (Auth + Firestore)
- Fonctionnalités complètes de livraison

---

**Besoin d'aide ?** Ouvrez une issue ou contactez l'équipe de développement.

🍔 **Bon appétit avec Good Food !** 🍕
