import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../service/supabase';

export default function VendorDetailPesananScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrder(); }, []);

  const fetchOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(nama_menu, qty, harga)')
      .eq('id', orderId)
      .single();
    setOrder(data);
    setLoading(false);
  };

  const updateStatus = (newStatus, confirmMsg) => {
    Alert.alert('Konfirmasi', confirmMsg, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ya', onPress: async () => {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        await fetchOrder();
      }},
    ]);
  };

  const STATUS_INFO = {
    menunggu:   { bg: '#FFF8E1', color: '#F57F17', label: '🔔 Menunggu Konfirmasi' },
    diproses:   { bg: '#E3F2FD', color: '#1565C0', label: '👨‍🍳 Sedang Diproses' },
    siap:       { bg: '#E8F5E9', color: '#2E7D32', label: '✅ Siap Diambil' },
    selesai:    { bg: '#F5F5F5', color: '#888',    label: '☑️ Selesai' },
    ditolak:    { bg: '#FFEBEE', color: '#C62828', label: '❌ Ditolak' },
    dibatalkan: { bg: '#FFEBEE', color: '#C62828', label: '🚫 Dibatalkan Customer' },
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1565C0" /></View>;
  if (!order) return <View style={styles.loadingContainer}><Text>Pesanan tidak ditemukan</Text></View>;

  const s = STATUS_INFO[order.status] || STATUS_INFO['menunggu'];

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Detail Pesanan</Text>
          <Text style={styles.headerSub}>#{order.id.split('-')[0].toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Status */}
        <View style={[styles.statusBanner, { backgroundColor: s.bg, borderColor: s.color + '55' }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          <Text style={styles.statusTime}>
            {new Date(order.created_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Item Pesanan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Item Pesanan</Text>
          {order.order_items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemNama}>{item.nama_menu}</Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
              <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {order.total_harga.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Info Pembayaran */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Pembayaran</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Metode</Text>
            <Text style={styles.infoValue}>{order.metode_bayar}</Text>
          </View>
          {order.bukti_bayar_url && (
            <View style={styles.buktiBayarContainer}>
              <Text style={styles.infoLabel}>Bukti Bayar</Text>
              <Image source={{ uri: order.bukti_bayar_url }} style={styles.buktiBayarImage} resizeMode="contain" />
            </View>
          )}
        </View>

        {/* Catatan */}
        {order.catatan ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Catatan dari Customer</Text>
            <Text style={styles.catatanText}>{order.catatan}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        {order.status === 'menunggu' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnTolak} onPress={() => updateStatus('ditolak', 'Tolak pesanan ini?')} activeOpacity={0.8}>
              <Text style={styles.btnTolakText}>❌ Tolak</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnTerima} onPress={() => updateStatus('diproses', 'Terima dan mulai proses pesanan ini?')} activeOpacity={0.8}>
              <Text style={styles.btnTerimaText}>✅ Terima & Proses</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'diproses' && (
          <TouchableOpacity style={styles.btnSiap} onPress={() => updateStatus('siap', 'Tandai pesanan siap diambil?')} activeOpacity={0.8}>
            <Text style={styles.btnSiapText}>🔔 Tandai Siap Diambil</Text>
          </TouchableOpacity>
        )}

        {order.status === 'siap' && (
          <TouchableOpacity style={styles.btnSelesai} onPress={() => updateStatus('selesai', 'Pesanan sudah diambil customer?')} activeOpacity={0.8}>
            <Text style={styles.btnSelesaiText}>✅ Tandai Sudah Diambil</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 26, color: '#1A1A1A', lineHeight: 30, marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  content: { padding: 16 },
  statusBanner: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  statusText: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  statusTime: { fontSize: 12, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemNama: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 12 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  buktiBayarContainer: { marginTop: 10 },
  buktiBayarImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 8, backgroundColor: '#F5F7FA' },
  catatanText: { fontSize: 13, color: '#444', lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnTolak: { flex: 1, backgroundColor: '#FFF3F3', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#EF5350' },
  btnTolakText: { color: '#EF5350', fontWeight: '700', fontSize: 14 },
  btnTerima: { flex: 2, backgroundColor: '#1565C0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTerimaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSiap: { backgroundColor: '#E8F5E9', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#4CAF50' },
  btnSiapText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
  btnSelesai: { backgroundColor: '#E3F2FD', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#1565C0' },
  btnSelesaiText: { color: '#1565C0', fontWeight: '700', fontSize: 15 },
});