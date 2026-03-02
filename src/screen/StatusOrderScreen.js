import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { supabase } from '../service/supabase';
import { setupOrderNotification } from '../service/notification';

const STATUS_STEPS = [
  { id: 1, key: 'menunggu', label: 'Pesanan Diterima', desc: 'Pesanan kamu sudah masuk ke toko', emoji: '📋' },
  { id: 2, key: 'diproses', label: 'Sedang Diproses', desc: 'Penjual sedang menyiapkan pesananmu', emoji: '👨‍🍳' },
  { id: 3, key: 'siap', label: 'Pesanan Siap', desc: 'Pesanan siap diambil di toko!', emoji: '✅' },
];

export default function StatusOrderScreen({ route, navigation }) {
  const { toko, totalHarga, catatan, metodeBayar, itemDiKeranjang, keranjang, orderId } = route.params;
  const [currentStatus, setCurrentStatus] = useState(1);

  useEffect(() => {
    setupOrderNotification(orderId, toko.nama);
    const timer1 = setTimeout(() => setCurrentStatus(2), 5000);
    const timer2 = setTimeout(() => setCurrentStatus(3), 12000);
    if (orderId) {
      setTimeout(() => { supabase.from('orders').update({ status: 'diproses' }).eq('id', orderId); }, 5000);
      setTimeout(() => { supabase.from('orders').update({ status: 'siap' }).eq('id', orderId); }, 12000);
    }
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  const getStepColor = (stepId) => {
    if (stepId < currentStatus) return '#4CAF50';
    if (stepId === currentStatus) return '#1565C0';
    return '#E8ECF0';
  };

  const statusLabel = currentStatus === 3 ? '✅ Siap Diambil!' : currentStatus === 2 ? '👨‍🍳 Sedang Dimasak' : '⏳ Menunggu Konfirmasi';

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerLabel}>Status Pesanan</Text>
          <Text style={styles.headerOrderId}>#{orderId?.slice(0, 8).toUpperCase()}</Text>
          <View style={[styles.statusPill, currentStatus === 3 && styles.statusPillGreen]}>
            <Text style={[styles.statusPillText, currentStatus === 3 && { color: '#2E7D32' }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Alert siap pickup */}
        {currentStatus === 3 && (
          <View style={styles.pickupAlert}>
            <Text style={styles.pickupAlertEmoji}>🎉</Text>
            <View>
              <Text style={styles.pickupAlertTitle}>Pesanan Siap Diambil!</Text>
              <Text style={styles.pickupAlertDesc}>Segera ke {toko.nama} untuk pickup</Text>
            </View>
          </View>
        )}

        {/* Tracking */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Tracking Pesanan</Text>
          {STATUS_STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepCircle, { backgroundColor: getStepColor(step.id) }]}>
                  {step.id < currentStatus ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : step.id === currentStatus ? (
                    <Text style={styles.stepDot}>●</Text>
                  ) : (
                    <Text style={styles.stepNum}>{step.id}</Text>
                  )}
                </View>
                {index < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: step.id < currentStatus ? '#4CAF50' : '#E8ECF0' }]} />
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepLabel, { color: step.id <= currentStatus ? '#1a1a1a' : '#bbb' }]}>
                  {step.emoji} {step.label}
                </Text>
                <Text style={[styles.stepDesc, { color: step.id <= currentStatus ? '#666' : '#ccc' }]}>
                  {step.desc}
                </Text>
                {step.id === currentStatus && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>● Status sekarang</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Info Toko */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 Info Pengambilan</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>{toko.emoji}</Text>
            <View>
              <Text style={styles.infoNama}>{toko.nama}</Text>
              <Text style={styles.infoKategori}>{toko.kategori}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoDetail}>
            <Text style={styles.infoDetailLabel}>⏱ Estimasi</Text>
            <Text style={styles.infoDetailValue}>{toko.waktu}</Text>
          </View>
          <View style={styles.infoDetail}>
            <Text style={styles.infoDetailLabel}>💳 Pembayaran</Text>
            <Text style={styles.infoDetailValue}>{metodeBayar.emoji} {metodeBayar.label}</Text>
          </View>
          {catatan ? (
            <View style={styles.infoDetail}>
              <Text style={styles.infoDetailLabel}>📝 Catatan</Text>
              <Text style={styles.infoDetailValue}>{catatan}</Text>
            </View>
          ) : null}
        </View>

        {/* Detail Pesanan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Detail Pesanan</Text>
          {itemDiKeranjang.map((menu) => (
            <View key={menu.id} style={styles.orderRow}>
              <Text style={styles.orderEmoji}>{menu.emoji}</Text>
              <Text style={styles.orderNama} numberOfLines={1}>{menu.nama}</Text>
              <Text style={styles.orderQty}>x{keranjang[menu.id]}</Text>
              <Text style={styles.orderHarga}>
                Rp {(menu.harga * keranjang[menu.id]).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Kembali ke Beranda */}
        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.homeButtonText}>🏠 Kembali ke Beranda</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ── Header ────────────────────────────────────────────
  header: {
    backgroundColor: '#fff',
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  headerInner: {
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerOrderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    letterSpacing: 1,
  },
  statusPill: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusPillGreen: {
    backgroundColor: '#E8F5E9',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
  },

  // ── Scroll ────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // ── Pickup Alert ──────────────────────────────────────
  pickupAlert: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  pickupAlertEmoji: { fontSize: 32 },
  pickupAlertTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  pickupAlertDesc: { fontSize: 12, color: '#555', marginTop: 2 },

  // ── Card ──────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  // ── Step ──────────────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 32,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCheck: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepDot: { color: '#fff', fontSize: 12 },
  stepNum: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 30,
    marginVertical: 2,
  },
  stepInfo: {
    flex: 1,
    paddingBottom: 20,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  activeBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '600',
  },

  // ── Info Toko ─────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoEmoji: { fontSize: 32 },
  infoNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  infoKategori: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  infoDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoDetailLabel: { fontSize: 13, color: '#888' },
  infoDetailValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // ── Order Detail ──────────────────────────────────────
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  orderEmoji: { fontSize: 20 },
  orderNama: { flex: 1, fontSize: 13, color: '#1a1a1a' },
  orderQty: { fontSize: 13, color: '#888' },
  orderHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  totalValue: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },

  // ── Home Button ───────────────────────────────────────
  homeButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#1565C0',
  },
  homeButtonText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: 'bold',
  },
});