import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useOrderSocket } from './hooks/useOrderSocket';
import { OrderCard } from './components/OrderCard';
import { generateEscPosTicket } from './utils/escpos';
import { Order } from './types';

const RESTAURANT_ID = process.env.RESTAURANT_ID || 'restaurant-1';

export default function App() {
  const { orders, connected, removeOrder } = useOrderSocket(RESTAURANT_ID);
  const [printing, setPrinting] = useState<string | null>(null);

  const handlePrint = useCallback(
    async (order: Order) => {
      setPrinting(order.id);
      try {
        // Generate ESC/POS payload
        const payload = generateEscPosTicket(order);
        console.log('[POS] ESC/POS payload generated, size:', payload.length, 'bytes');

        // Simulate print delay
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));

        Alert.alert(
          '✅ Printed',
          `Order #${order.id.slice(-8).toUpperCase()} sent to printer.\nPayload: ${payload.length} bytes`,
          [
            {
              text: 'Dismiss',
              onPress: () => removeOrder(order.id),
            },
          ],
        );
      } catch (e) {
        Alert.alert('Print Error', 'Failed to send to printer');
      } finally {
        setPrinting(null);
      }
    },
    [removeOrder],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽 Jaad POS</Text>
        <View style={styles.connectionBadge}>
          <View style={[styles.dot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.connectionText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      {/* Orders */}
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={styles.emptyTitle}>Waiting for Orders</Text>
          <Text style={styles.emptySubtitle}>New orders will appear here automatically</Text>
          {!connected && (
            <Text style={styles.offlineHint}>⚠️ Not connected to server</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPrint={printing === item.id ? () => {} : handlePrint}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Order count badge */}
      {orders.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length} pending</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  offlineHint: {
    marginTop: 16,
    fontSize: 13,
    color: '#ef4444',
  },
  countBadge: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 6,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
