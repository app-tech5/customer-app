// Configuration de l'application
export const config = {
  // URL de votre serveur Express/MongoDB
  // API_BASE_URL: 'http://192.168.43.197:5000/api', // ✅ IP réseau local

  API_BASE_URL: 'https://deshawn-athermanous-indefensibly.ngrok-free.dev/api', // ✅ IP réseau local avec ngrok

  // Autres configurations
  APP_NAME: 'Good Food',
  VERSION: '1.0.0',

  // Mode démonstration - préremplit les champs de connexion admin
  DEMO_MODE: true,

  // Identifiants de démonstration (utilisés uniquement en mode DEMO_MODE)
  // DEMO_EMAIL: 'admin@example.com', // ✅ Admin système (fixe dans migration)
  DEMO_EMAIL: 'demo@customer.com', // ✅ Customer de démo (fixe dans migration)
  // DEMO_PASSWORD: 'admin123', // Pour admin
  DEMO_PASSWORD: 'demo123', // Pour customer demo

  // Timeout pour les requêtes API (en millisecondes)
  API_TIMEOUT: 10000,
};
