import { Order } from '../types';

/**
 * Generates a mock ESC/POS byte array for a thermal printer.
 * In production, this would be sent over a LAN/Wi-Fi socket to the printer.
 */
export function generateEscPosTicket(order: Order): Uint8Array {
  const lines: string[] = [
    '\x1B\x40',               // Initialize printer
    '\x1B\x61\x01',           // Center alignment
    '=== JAAD CAFE ===\n',
    '=================\n',
    '\x1B\x61\x00',           // Left alignment
    `Order : #${order.id.slice(-8).toUpperCase()}\n`,
    `Table : ${order.table?.number ?? 'N/A'}\n`,
    `Name  : ${order.customerName ?? 'Guest'}\n`,
    `Pay   : ${order.paymentMethod ?? 'N/A'}\n`,
    `Time  : ${new Date(order.createdAt).toLocaleTimeString('id-ID')}\n`,
    '-----------------\n',
  ];

  for (const item of order.items) {
    const itemName = item.menuItem?.name ?? item.menuItemId;
    const itemTotal = item.unitPrice * item.quantity;
    lines.push(`${item.quantity}x ${itemName}\n`);
    lines.push(`   Rp ${itemTotal.toLocaleString('id-ID')}\n`);
    if (item.notes) {
      lines.push(`   *${item.notes}\n`);
    }
  }

  lines.push('-----------------\n');
  lines.push(`TOTAL: Rp ${order.totalAmount.toLocaleString('id-ID')}\n`);
  lines.push('\n\n\n');
  lines.push('\x1D\x56\x00'); // Full cut

  const text = lines.join('');
  const encoder = new TextEncoder();
  return encoder.encode(text);
}
