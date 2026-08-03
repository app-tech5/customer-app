import { ApiClient } from './client';

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) q.set(key, value.join(','));
      return;
    }
    q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

ApiClient.prototype.getIntelligenceRecommendations = async function (params = {}) {
  return this.apiCall(`/intelligence/recommendations${buildQuery(params)}`);
};

ApiClient.prototype.getIntelligenceEta = async function (params = {}) {
  return this.apiCall(`/intelligence/eta${buildQuery(params)}`);
};

ApiClient.prototype.getIntelligenceSurge = async function (params = {}) {
  return this.apiCall(`/intelligence/surge${buildQuery(params)}`);
};

ApiClient.prototype.getIntelligenceQuote = async function (params = {}) {
  return this.apiCall(`/intelligence/quote${buildQuery(params)}`);
};
