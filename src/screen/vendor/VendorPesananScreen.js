import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';

// ── DUMMY DATA ────────────────────────────────────────────
const DUMMY_ORDERS = [
  {
    id: 'ord-001',
    items: [
      { nama: 'Nasi Ayam Bakar', qty: 2, harga: 15000 },
      { nama: 'Es Teh Manis',    qty: 2, harga: 4000  },
    ],
    waktu: '11:42', status: 'menunggu', total: 38000,
    metode: 'QRIS', catatan: 'Ayamnya jangan gosong ya kak',
  },
  {
    id: 'ord-002',
    items: [
      { nama: 'Nasi Goreng Spesial', qty: 1, harga: 18000 },
      { nama: 'Jus Jeruk',           qty: 1, harga: 7000  },
    ],
    waktu: '11:30', status: 'diproses', total: 25000,
    metode: 'Transfer', catatan: '',
  },
  {
    id: 'ord-003',
    items: [{ nama: 'Mie Goreng', qty: 2, harga: 12000 }],
    waktu: '11:15', status: 'siap', total: 24000,
    metode: 'Tunai', catatan: '',
  },
  {
    id: 'ord-004',
    items: [{ nama: 'Nasi Soto', qty: 1, harga: 15000 }],
    waktu: '10:55', status: 'selesai', total: 15000,
    metode: 'QRIS', catatan: '',
  },
  {
    id: 'ord-005',
    items: [
      { nama: 'Nasi Rendang', qty: 1, harga: 20000 },
      { nama: 'Teh Manis',    qty: 1, harga: 5000  },
    ],
    waktu: '10:30', status: 'selesai', total: 25000,
    metode: 'Tunai', catatan: '',
  },
  {
    id: 'ord-006',
    items: [{ nama: 'Ayam Geprek', qty: 2, harga: 16000 }],
    waktu: '10:10', status: 'ditolak', total: 32000,
    metode: 'QRIS', catatan: '',
  },
];

const TABS = [
  { id: 'menunggu', label: 'Menunggu', emoji: '🔔' },
  { id: 'diproses', label: 'Diproses', emoji: '👨‍🍳' },
  { id: 'siap',     label: 'Siap',     emoji: '✅' },
  { id: 'selesai',  label: 'Selesai',  emoji: '🕐' },
  { id: 'ditolak',  label: 'Ditolak',  emoji: '❌' },
];
// ─────────────────────────────────────────────────────────

export default function VendorPesananScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('menunggu');
  const [orders, setOrders] = useState(DUMMY_ORDERS);

  const filtered = orders.filter(o => o.status === activeTab);
  const counts = Object.fromEntries(TABS.map(t => [t.id, orders.filter(o => o.status === t.id).length]));

  const updateStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const handleTerima = (id) => {
    Alert.alert('Terima Pesanan?', 'Pesanan akan mulai diproses.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Terima', onPress: () => { updateStatus(id, 'diproses'); setActiveTab('diproses'); } },
    ]);
  };

  const handleTolak = (id) => {
    Alert.alert('Tolak Pesanan?', 'Pesanan akan ditolak dan customer akan diberitahu.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Tolak', style: 'destructive', onPress: () => updateStatus(id, 'ditolak') },
    ]);
  };

  const handleSiap = (id) => {
    Alert.alert('Pesanan Siap?', 'Tandai pesanan siap diambil oleh customer.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Siap!', onPress: () => { updateStatus(id, 'siap'); setActiveTab('siap'); } },
    ]);
  };

  const handleSelesai = (id) => {
    Alert.alert('Tandai Selesai?', 'Pesanan sudah diambil oleh customer.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Selesai', onPress: () => { updateStatus(id, 'selesai'); setActiveTab('selesai'); } },
    ]);
  };

  const handleNotifCustomer = (id) => {
    Alert.alert(
      '🔔 Kirim Notifikasi',
      'Pilih estimasi waktu untuk dikirim ke customer:',
      [
        { text: '⏱ Siap dalam 10 menit', onPress: () => Alert.alert('Terkirim! ✅', 'Customer sudah diberitahu pesanan siap dalam 10 menit.') },
        { text: '⏱ Siap dalam 5 menit',  onPress: () => Alert.alert('Terkirim! ✅', 'Customer sudah diberitahu pesanan siap dalam 5 menit.') },
        { text: '⏱ Siap dalam 2 menit',  onPress: () => Alert.alert('Terkirim! ✅', 'Customer sudah diberitahu pesanan siap dalam 2 menit.') },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Masuk</Text>
        <Text style={styles.headerSub}>Kelola semua pesanan tokomu</Text>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.tabActive]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.7}>
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            {counts[tab.id] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>{counts[tab.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Tidak ada pesanan</Text>
          <Text style={styles.emptyDesc}>Pesanan "{TABS.find(t => t.id === activeTab)?.label}" akan muncul di sini</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filtered.map((order) => (
            <View key={order.id} style={styles.orderCard}>

              {/* Card Top */}
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.orderId}>#{order.id.toUpperCase()}</Text>
                  <Text style={styles.orderTime}>🕐 {order.waktu}</Text>
                </View>
                <View style={[
                  styles.metodeBadge,
                  order.metode === 'QRIS' && styles.metodeQris,
                  order.metode === 'Transfer' && styles.metodeTransfer,
                  order.metode === 'Tunai' && styles.metodeTunai,
                ]}>
                  <Text style={[
                    styles.metodeText,
                    order.metode === 'QRIS' && { color: '#6A1B9A' },
                    order.metode === 'Transfer' && { color: '#1565C0' },
                    order.metode === 'Tunai' && { color: '#2E7D32' },
                  ]}>💳 {order.metode}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Items */}
              {order.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemNama}>{item.nama}</Text>
                  <Text style={styles.itemQty}>x{item.qty}</Text>
                  <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Footer */}
              <View style={styles.cardBottom}>
                <View style={{ flex: 1 }}>
                  {order.catatan
                    ? <Text style={styles.catatan} numberOfLines={1}>📝 {order.catatan}</Text>
                    : <Text style={styles.noCatatan}>Tidak ada catatan</Text>
                  }
                </View>
                <Text style={styles.totalText}>Rp {order.total.toLocaleString('id-ID')}</Text>
              </View>

              {/* ── Action Buttons ── */}
              <View style={styles.actionRow}>

                {/* MENUNGGU: 3 button sama besar */}
                {activeTab === 'menunggu' && (
                  <>
                    <TouchableOpacity style={[styles.btn, styles.btnOutlineRed]} onPress={() => handleTolak(order.id)} activeOpacity={0.8}>
                      <Text style={styles.btnTextRed}>❌ Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnOutlineGray]} onPress={() => navigation.navigate('VendorDetailPesanan', { orderId: order.id })} activeOpacity={0.8}>
                      <Text style={styles.btnTextGray}>🔍 Detail</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => handleTerima(order.id)} activeOpacity={0.8}>
                      <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.btnTextWhite}>✅ Terima</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* DIPROSES: 2 button sama besar */}
                {activeTab === 'diproses' && (
                  <>
                    <TouchableOpacity style={[styles.btn, styles.btnOutlineYellow]} onPress={() => handleNotifCustomer(order.id)} activeOpacity={0.8}>
                      <Text style={styles.btnTextYellow}>🔔 Notif Customer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => handleSiap(order.id)} activeOpacity={0.8}>
                      <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.btnTextWhite}>🍽️ Tandai Siap</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* SIAP: 1 button full width */}
                {activeTab === 'siap' && (
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={() => handleSelesai(order.id)} activeOpacity={0.8}>
                    <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.btnTextWhite}>✅ Tandai Sudah Diambil</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },

  tabScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', maxHeight: 60 },
  tabContainer: { paddingHorizontal: 16, gap: 6, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#F5F7FA' },
  tabActive: { backgroundColor: '#1565C0' },
  tabEmoji: { fontSize: 13 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabLabelActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#E0E0E0', borderRadius: 100, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  tabBadgeTextActive: { color: '#fff' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  listContent: { padding: 16 },

  // Card
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#1A1A1A' },
  orderTime: { fontSize: 12, color: '#888' },
  metodeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  metodeQris: { backgroundColor: '#F3E5F5' },
  metodeTransfer: { backgroundColor: '#E3F2FD' },
  metodeTunai: { backgroundColor: '#E8F5E9' },
  metodeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemNama: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 10 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  catatan: { fontSize: 12, color: '#F57F17' },
  noCatatan: { fontSize: 12, color: '#ccc' },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },

  // ── Buttons — all equal size, same style ──
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, borderRadius: 10, overflow: 'hidden' },

  btnOutlineRed: { backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#EF5350', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  btnTextRed: { color: '#EF5350', fontWeight: '600', fontSize: 13 },

  btnOutlineGray: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  btnTextGray: { color: '#555', fontWeight: '600', fontSize: 13 },

  btnOutlineYellow: { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFC107', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  btnTextYellow: { color: '#F57F17', fontWeight: '600', fontSize: 13 },

  btnPrimary: { elevation: 2, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnGradient: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  btnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 13 },
});