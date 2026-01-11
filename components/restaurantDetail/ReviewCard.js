import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Icon } from 'react-native-elements'
import { colors } from '../../global'

export default function ReviewCard({ review }) {
  if (!review) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        type="material-community"
        size={14}
        color={i < rating ? colors.accent : colors.grey[300]}
      />
    ));
  };

  const userName = review.user?.name || review.userName || 'Anonymous';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {review.user?.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{userInitial}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.ratingRow}>
            {renderStars(review.rating)}
            <Text style={styles.dateText}>{formatDate(review.date || review.createdAt)}</Text>
          </View>
        </View>
      </View>

      {review.comment && (
        <Text style={styles.comment} numberOfLines={3}>
          {review.comment}
        </Text>
      )}

      {/* Détails supplémentaires si disponibles */}
      {(review.foodQuality || review.deliveryTime || review.packaging) && (
        <View style={styles.detailsRow}>
          {review.foodQuality && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Food</Text>
              <Text style={styles.detailValue}>{review.foodQuality}/5</Text>
            </View>
          )}
          {review.deliveryTime && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Delivery</Text>
              <Text style={styles.detailValue}>{review.deliveryTime}/5</Text>
            </View>
          )}
          {review.packaging && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Packaging</Text>
              <Text style={styles.detailValue}>{review.packaging}/5</Text>
            </View>
          )}
        </View>
      )}

      {/* Photos si disponibles */}
      {review.photos && review.photos.length > 0 && (
        <View style={styles.photosRow}>
          {review.photos.slice(0, 3).map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.photo}
            />
          ))}
          {review.photos.length > 3 && (
            <View style={styles.morePhotos}>
              <Text style={styles.morePhotosText}>+{review.photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Réponse du restaurant si disponible */}
      {review.reply && review.reply.text && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyLabel}>Restaurant reply:</Text>
          <Text style={styles.replyText}>{review.reply.text}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  comment: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  morePhotos: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.grey[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  replyContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 13,
    color: colors.text.primary,
  },
})

