const path = require('path');

const SCRIPTS_DIR = __dirname;

const SUITE = [
  {
    id: 'login-home',
    file: 'smoke-login-home.js',
    description: 'Live API login → Home restaurants (Hermes CDP)',
    needsAuth: false,
    autoNavigate: false,
  },
];

const resolveScriptPath = (entry) => path.join(SCRIPTS_DIR, entry.file);

module.exports = {
  SUITE,
  SCRIPTS_DIR,
  resolveScriptPath,
};
