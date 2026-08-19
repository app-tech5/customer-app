import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { getOrderChat, sendOrderChatMessage } from '../api';
import { config } from '../config';
import { colors } from '../global';
import i18n from '../lang/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const order = route.params?.order;
  const orderId = route.params?.orderId || order?.id || order?._id;
  const peerName =
    route.params?.peerName ||
    order?.driver?.userId?.name ||
    order?.driver?.name ||
    i18n.t('chat.driver', 'Driver');

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const listRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('chat.titleWith', 'Chat with {{name}}', { name: peerName }),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.goBack')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, peerName]);

  useEffect(() => {
    AsyncStorage.getItem('userData').then((raw) => {
      if (!raw) return;
      try {
        const user = JSON.parse(raw);
        setMyUserId(String(user.id || user._id || ''));
      } catch {
        /* ignore */
      }
    });
  }, []);

  const appendMessage = useCallback((msg) => {
    if (!msg?.id) return;
    setMessages((prev) => {
      if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
      return [...prev, msg];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getOrderChat(orderId);
      setMessages(data?.messages || []);
    } catch (error) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!orderId) return undefined;
    const url = String(config.API_BASE_URL).replace(/\/api\/?$/, '');
    const socket = io(url, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('joinOrderChatRoom', orderId);
    });
    socket.on('order-chat-message', (payload) => {
      if (String(payload?.order) === String(orderId)) {
        appendMessage(payload);
      }
    });
    return () => {
      socket.emit('leaveOrderChatRoom', orderId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, appendMessage]);

  useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });
  }, [messages.length]);

  const onSend = async () => {
    const value = text.trim();
    if (!value || !orderId || sending) return;
    try {
      setSending(true);
      setText('');
      const saved = await sendOrderChatMessage(orderId, value);
      appendMessage(saved);
    } catch (error) {
      setText(value);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const mine = myUserId && String(item.sender) === String(myUserId);
    return (
      <View style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirsRow]}>
        <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirsBubble]}>
          {!mine ? (
            <Text style={styles.senderLabel}>
              {item.senderName || peerName}
            </Text>
          ) : null}
          <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.text}</Text>
          <Text style={[styles.time, mine && styles.mineTime]}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>
      </View>
    );
  };

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={42} color={colors.grey?.[400] || '#bbb'} />
        <Text style={styles.emptyTitle}>{i18n.t('chat.emptyTitle', 'No messages yet')}</Text>
        <Text style={styles.emptySub}>
          {i18n.t('chat.emptySub', 'Say hello to coordinate the delivery.')}
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={empty}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
          />
        )}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={i18n.t('chat.placeholder', 'Type a message…')}
            placeholderTextColor={colors.grey?.[400] || '#999'}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
            onPress={onSend}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('chat.send', 'Send')}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background?.primary || '#fff' },
  flex: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text?.primary || '#111' },
  emptySub: { fontSize: 14, color: colors.text?.secondary || '#666', textAlign: 'center', paddingHorizontal: 24 },
  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  theirsRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mineBubble: { backgroundColor: colors.primary || '#e23b26', borderBottomRightRadius: 4 },
  theirsBubble: { backgroundColor: colors.background?.secondary || '#f2f2f5', borderBottomLeftRadius: 4 },
  senderLabel: { fontSize: 11, fontWeight: '700', color: colors.text?.secondary || '#666', marginBottom: 2 },
  bubbleText: { fontSize: 15, color: colors.text?.primary || '#111', lineHeight: 20 },
  mineText: { color: '#fff' },
  time: { fontSize: 10, color: colors.text?.secondary || '#888', marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: 'rgba(255,255,255,0.8)' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border?.medium || '#ddd',
    gap: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border?.medium || '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text?.primary || '#111',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary || '#e23b26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
