import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Order, OrderStatus } from '../types';

interface OrderCardProps {
  order: Order;
  onPrint: (order: Order) => void;
}

function getWaitColors(createdAt: string): { border: string; badgeBg: string; text: string } {
  const waitMs = Date.now() - new Date(createdAt).getTime();
  const waitMin = waitMs / 60000;
  if (waitMin < 5) return { border: '#22c55e', badgeBg: '#dcfce7', text: '#15803d' };
  if (waitMin < 10) return { border: '#f59e0b', badgeBg: '#fef3c7', text: '#b45309' };
  return { border: '#ef4444', badgeBg: '#fee2e2', text: '#b91c1c' };
}

function formatPrice(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPrint }) => {
  const waitColors = useMemo(() => getWaitColors(order.createdAt), [order.createdAt]);

  return (
    <View style={[styles.card, { borderLeftColor: waitColors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.tableInfo}>
            Table {order.table?.number ?? 'N/A'} • {formatTime(order.createdAt)}
          </Text>
          {order.customerName ? (
            <Text style={styles.customerName}>{order.customerName}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: waitColors.badgeBg }]}>
          <Text style={[styles.statusText, { color: waitColors.text }]}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {order.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemQty}>{item.quantity}×</Text>
          <Text style={styles.itemName}>{item.menuItem?.name ?? item.menuItemId}</Text>
          <Text style={styles.itemPrice}>{formatPrice(item.unitPrice * item.quantity)}</Text>
        </View>
      ))}

      {order.items.some((i) => i.notes) && (
        <View style={styles.notesContainer}>
          {order.items
            .filter((i) => i.notes)
            .map((i) => (
              <Text key={i.id} style={styles.noteText}>
                ★ {i.menuItem?.name}: {i.notes}
              </Text>
            ))}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total: {formatPrice(order.totalAmount)}</Text>
        {order.paymentMethod ? (
          <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.printButton}
          onPress={() => onPrint(order)}
          activeOpacity={0.7}
          accessibilityLabel="Print order ticket"
        >
          <Text style={styles.printButtonText}>🖨 Print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 14,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  tableInfo: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  customerName: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  itemPrice: {
    fontSize: 13,
    color: '#374151',
  },
  notesContainer: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#fef9c3',
    borderRadius: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#713f12',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  printButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
