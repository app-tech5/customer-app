import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  Dimensions,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { colors } from '../../global';
import i18n from '../../lang/i18n';
import { isPromotionActive } from '../../api/promotionsHelpers';

const defaultFoodImage = require('../../assets/images/default-food.jpg');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_INSET = 20;
const SLIDE_WIDTH = SCREEN_WIDTH;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_INSET * 2;
const BANNER_HEIGHT = 168;
const AUTO_PLAY_MS = 4500;

const PANEL_COLORS = ['#ebe2ff', '#e4f2ef', '#fdeee8'];

function buildHeadline(promotion) {
  if (!promotion) {
    return i18n.t('home.promoBanner.defaultHeadline');
  }

  if (promotion.promotionType === 'free_delivery') {
    return i18n.t('home.promoBanner.freeDeliveryHeadline');
  }

  if (promotion.promotionType === 'percentage_discount' && promotion.discountValue) {
    return i18n.t('home.promoBanner.percentHeadline', { value: promotion.discountValue });
  }

  return promotion.name || i18n.t('home.promoBanner.defaultHeadline');
}

function buildSubheadline(promotion) {
  if (promotion?.description) {
    return promotion.description;
  }

  return i18n.t('home.promoBanner.defaultSubheadline');
}

function buildFallbackSlides() {
  return [
    {
      id: 'fallback-free-delivery',
      headline: i18n.t('home.promoBanner.defaultHeadline'),
      subheadline: i18n.t('home.promoBanner.defaultSubheadline'),
      image: null,
      panelColor: PANEL_COLORS[0],
    },
    {
      id: 'fallback-weekend',
      headline: i18n.t('home.promoBanner.weekendHeadline'),
      subheadline: i18n.t('home.promoBanner.weekendSubheadline'),
      image: null,
      panelColor: PANEL_COLORS[1],
    },
    {
      id: 'fallback-new-users',
      headline: i18n.t('home.promoBanner.newUsersHeadline'),
      subheadline: i18n.t('home.promoBanner.newUsersSubheadline'),
      image: null,
      panelColor: PANEL_COLORS[2],
    },
  ];
}

function buildSlides(promotions) {
  const active = (promotions || [])
    .filter((promotion) => isPromotionActive(promotion))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const platformSlides = active
    .filter((promotion) => promotion.scope === 'platform')
    .slice(0, 3)
    .map((promotion, index) => ({
      id: String(promotion._id || promotion.id || `platform-${index}`),
      headline: buildHeadline(promotion),
      subheadline: buildSubheadline(promotion),
      image: promotion.image || null,
      panelColor: PANEL_COLORS[index % PANEL_COLORS.length],
    }));

  if (platformSlides.length >= 2) {
    return platformSlides;
  }

  const fallback = buildFallbackSlides();
  const merged = [...platformSlides];
  fallback.forEach((slide) => {
    if (merged.length < 3 && !merged.some((item) => item.headline === slide.headline)) {
      merged.push(slide);
    }
  });

  return merged.slice(0, 3);
}

function PromoSlide({ item, onPress }) {
  const imageSource = item.image ? { uri: item.image } : defaultFoodImage;

  return (
    <View style={styles.slide}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        style={styles.cardTouchable}
        accessibilityRole="button"
        accessibilityLabel={item.headline}
      >
        <View style={[styles.card, { backgroundColor: item.panelColor }]}>
          <View style={[styles.copyPanel, { backgroundColor: item.panelColor }]}>
            <View style={styles.textBlock}>
              <Text style={styles.headline} numberOfLines={2}>
                {item.headline}
              </Text>
              <Text style={styles.subheadline} numberOfLines={2}>
                {item.subheadline}
              </Text>
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{i18n.t('home.promoBanner.browseOffers')}</Text>
              <AntDesign name="arrowright" size={16} color={colors.text.primary} />
            </View>
          </View>

          <ImageBackground
            source={imageSource}
            style={styles.imagePanel}
            imageStyle={styles.image}
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function HomePromoBanner({ promotions, navigation }) {
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = useMemo(
    () => buildSlides(promotions),
    [promotions]
  );

  const handlePress = () => {
    const drawerNav = navigation.getParent?.()?.getParent?.();
    if (drawerNav?.navigate) {
      drawerNav.navigate('Offers');
      return;
    }

    navigation.navigate('Offers');
  };

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SLIDE_WIDTH}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
          setActiveIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: SLIDE_WIDTH,
          offset: SLIDE_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => <PromoSlide item={item} onPress={handlePress} />}
      />

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  slide: {
    width: SLIDE_WIDTH,
    height: BANNER_HEIGHT,
    paddingHorizontal: HORIZONTAL_INSET,
  },
  cardTouchable: {
    width: CARD_WIDTH,
    height: BANNER_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dfd2f8',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  copyPanel: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    justifyContent: 'flex-start',
  },
  textBlock: {
    flexShrink: 1,
  },
  headline: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  subheadline: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  cta: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 4,
  },
  imagePanel: {
    width: 118,
    height: BANNER_HEIGHT,
  },
  image: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d7d7d7',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
