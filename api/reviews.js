import { ApiClient } from './client';

ApiClient.prototype.getRestaurantReviews = async function (restaurantId) {
  try {
    const reviews = await this.apiCall('/resource/reviews');
    const filtered = reviews.filter((review) => {
      const reviewRestaurantId = review.restaurant?._id || review.restaurant;
      const matchesRestaurant = String(reviewRestaurantId) === String(restaurantId);
      const matchesStatus = review.status === 'approved';
      return matchesRestaurant && matchesStatus;
    });
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

ApiClient.prototype.getMyReviews = async function (userId) {
  try {
    return await this.apiCall(`/users/${userId}/reviews`);
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    return [];
  }
};

ApiClient.prototype.createReview = async function (restaurantId, data) {
  return await this.apiCall('/resource/reviews', {
    method: 'POST',
    body: JSON.stringify({ restaurantId, ...data }),
  });
};

ApiClient.prototype.updateReview = async function (reviewId, data) {
  return await this.apiCall(`/resource/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.deleteReview = async function (reviewId) {
  return await this.apiCall(`/resource/reviews/${reviewId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.getReviewById = async function (reviewId) {
  try {
    return await this.apiCall(`/resource/reviews/${reviewId}`);
  } catch (error) {
    console.error('Error fetching review:', error);
    return null;
  }
};
