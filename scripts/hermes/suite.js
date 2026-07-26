const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '..');

const SUITE = [
  {
    id: 'home-promotions',
    file: 'hermes-home-promotions-test.js',
    description: 'Home — catégories, bannière promo, badges, Special Offers',
    needsAuth: false,
    autoNavigate: true,
  },
];

const resolveScriptPath = (entry) => path.join(SCRIPTS_DIR, entry.file);

const getById = (id) => SUITE.find((t) => t.id === id);

module.exports = {
  SUITE,
  SCRIPTS_DIR,
  resolveScriptPath,
  getById,
};
