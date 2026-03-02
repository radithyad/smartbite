import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../service/supabase';

const STATUS_LABEL = {
  menunggu: { label: 'Menunggu Konfirmasi', emoji: '📋', color: '#F57F17', bg: '#FFF8E1' },
  diproses: { label: 'Sedang Diproses', emoji: '👨‍🍳', color: '#1565C0', bg: '#E3F2FD' },
  siap: { label: 'Siap Diambil!', emoji: '✅', color: '#2E7D32', bg: '#E8F5E9' },
};

export default function AktivitasScreen({ navigation }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { fetchActiveOrders(); }, []));

  const fetchActiveOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('orders')
      .select(`*, toko (nama, emoji, kategori), order_items (nama_menu, qty, harga)`)
      .eq('customer_id', user.id)
      .in('status', ['menunggu', 'diproses', 'siap'])
      .order('created_at', { ascending: false });
    if (!error) setActiveOrders(data || []);
    setLoading(false);
  };

  const handleCancel = (orderId) => {
    Alert.alert('Batalkan Pesanan?', 'Pesanan yang dibatalkan tidak bisa dikembalikan. Yakin?', [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Ya, Batalkan', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('orders').update({ status: 'dibatalkan' }).eq('id', orderId);
        if (error) Alert.alert('Gagal', 'Tidak bisa membatalkan pesanan.');
        else { Alert.alert('Dibatalkan', 'Pesananmu berhasil dibatalkan.'); fetchActiveOrders(); }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aktivitas</Text>
        <Text style={styles.headerSub}>Pesanan yang sedang berjalan</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Memuat aktivitas...</Text>
        </View>
      ) : activeOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Tidak ada pesanan aktif</Text>
          <Text style={styles.emptyDesc}>Pesanan yang sedang diproses akan muncul di sini</Text>
          <TouchableOpacity style={styles.orderButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
            <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.orderButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.orderButtonText}>Pesan Sekarang 🍱</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeOrders.map((order) => {
            const s = STATUS_LABEL[order.status] || STATUS_LABEL['menunggu'];
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.color }]}>{s.emoji} {s.label}</Text>
                </View>
                <View style={styles.tokoRow}>
                  <Text style={styles.tokoEmoji}>{order.toko?.emoji}</Text>
                  <View>
                    <Text style={styles.tokoNama}>{order.toko?.nama}</Text>
                    <Text style={styles.tokoKategori}>{order.toko?.kategori}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                {order.order_items?.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemNama}>{item.nama_menu}</Text>
                    <Text style={styles.itemQty}>x{item.qty}</Text>
                    <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.orderBottom}>
                  <View>
                    <Text style={styles.metodeText}>💳 {order.metode_bayar}</Text>
                    <Text style={styles.tanggalText}>{new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <Text style={styles.totalText}>Rp {order.total_harga.toLocaleString('id-ID')}</Text>
                </View>
                {order.status === 'siap' && (
                  <View style={styles.pickupAlert}>
                    <Text style={styles.pickupAlertText}>🎉 Segera ke {order.toko?.nama} untuk pickup!</Text>
                  </View>
                )}
                {order.status === 'menunggu' && (
                  <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(order.id)} activeOpacity={0.8}>
                    <Text style={styles.cancelText}>❌ Batalkan Pesanan</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 70, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  orderButton: { borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  orderButtonGradient: { paddingVertical: 14, paddingHorizontal: 32 },
  orderButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 12 },
  statusText: { fontSize: 13, fontWeight: '700' },
  tokoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  tokoEmoji: { fontSize: 30 },
  tokoNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  tokoKategori: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemNama: { flex: 1, fontSize: 13, color: '#1a1a1a' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 10 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metodeText: { fontSize: 12, color: '#666' },
  tanggalText: { fontSize: 11, color: '#aaa', marginTop: 2 },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },
  pickupAlert: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#4CAF50' },
  pickupAlertText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', textAlign: 'center' },
  cancelButton: { backgroundColor: '#FFF3F3', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12, borderWidth: 1.5, borderColor: '#EF5350' },
  cancelText: { color: '#EF5350', fontWeight: '600', fontSize: 13 },
});