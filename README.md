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

## 🛠️ Technologies

### Frontend (React Native)
- **React Native** 0.81.5
- **Expo** ~54.0.0
- **React Navigation** v6 (Stack, Tab, Drawer)
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

### v2.0.0 (Migration API)
- ✅ Suppression complète de Firebase
- ✅ Migration vers API REST personnalisée
- ✅ Ajout système d'authentification JWT
- ✅ Persistance locale avec AsyncStorage
- ✅ Correction bugs navigation Onboarding
- ✅ Nettoyage imports Firebase

### v1.0.0 (Original)
- Application avec Firebase (Auth + Firestore)
- Fonctionnalités complètes de livraison

---

**Besoin d'aide ?** Ouvrez une issue ou contactez l'équipe de développement.

🍔 **Bon appétit avec Good Food !** 🍕
