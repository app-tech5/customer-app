import { ApiClient } from './client';

ApiClient.prototype.getActiveSponsoredListings = async function (placement) {
  const q = placement ? `?placement=${encodeURIComponent(placement)}` : '';
  return this.apiCall(`/sponsored/active${q}`);
};

ApiClient.prototype.trackSponsoredListing = async function (id, type = 'impression') {
  return this.apiCall(`/sponsored/${encodeURIComponent(String(id))}/track`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
};
