import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../service/supabase';

const TABS = [
  { id: 'menunggu', label: 'Menunggu', emoji: '🔔' },
  { id: 'diproses', label: 'Diproses', emoji: '👨‍🍳' },
  { id: 'siap',     label: 'Siap',     emoji: '✅' },
  { id: 'selesai',  label: 'Selesai',  emoji: '🕐' },
  { id: 'ditolak',  label: 'Ditolak',  emoji: '❌' },
];

const STATUS_INFO = {
  menunggu:   { bg: '#FFF8E1', color: '#F57F17' },
  diproses:   { bg: '#E3F2FD', color: '#1565C0' },
  siap:       { bg: '#E8F5E9', color: '#2E7D32' },
  selesai:    { bg: '#F5F5F5', color: '#888' },
  ditolak:    { bg: '#FFEBEE', color: '#C62828' },
  dibatalkan: { bg: '#FFEBEE', color: '#C62828' },
};

export default function VendorPesananScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('menunggu');
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokoId, setTokoId] = useState(null);

  useFocusEffect(useCallback(() => { init(); }, []));

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: toko } = await supabase.from('toko').select('id').eq('owner_id', user.id).single();
    if (toko) { setTokoId(toko.id); await fetchOrders(toko.id, activeTab); await fetchCounts(toko.id); }
    setLoading(false);
  };

  const fetchOrders = async (tid, status) => {
    const id = tid || tokoId;
    if (!id) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(nama_menu, qty, harga)')
      .eq('toko_id', id)
      .eq('status', status)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const fetchCounts = async (tid) => {
    const id = tid || tokoId;
    if (!id) return;
    const result = {};
    for (const tab of TABS) {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('toko_id', id)
        .eq('status', tab.id);
      result[tab.id] = count || 0;
    }
    setCounts(result);
  };

  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    setLoading(true);
    await fetchOrders(tokoId, tabId);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(tokoId, activeTab);
    await fetchCounts(tokoId);
    setRefreshing(false);
  };

  const handleTerima = (orderId) => {
    Alert.alert('Terima Pesanan?', 'Pesanan akan mulai diproses.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Terima', onPress: async () => {
        await supabase.from('orders').update({ status: 'diproses' }).eq('id', orderId);
        await fetchOrders(tokoId, activeTab);
        await fetchCounts(tokoId);
      }},
    ]);
  };

  const handleTolak = (orderId) => {
    Alert.alert('Tolak Pesanan?', 'Pesanan akan ditolak dan customer akan diberitahu.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Tolak', style: 'destructive', onPress: async () => {
        await supabase.from('orders').update({ status: 'ditolak' }).eq('id', orderId);
        await fetchOrders(tokoId, activeTab);
        await fetchCounts(tokoId);
      }},
    ]);
  };

  const handleSiap = (orderId) => {
    Alert.alert('Pesanan Siap?', 'Tandai pesanan ini sudah siap diambil customer.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Siap!', onPress: async () => {
        await supabase.from('orders').update({ status: 'siap' }).eq('id', orderId);
        await fetchOrders(tokoId, activeTab);
        await fetchCounts(tokoId);
      }},
    ]);
  };

  const handleSelesai = (orderId) => {
    Alert.alert('Selesai?', 'Tandai pesanan sudah diambil customer.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Selesai', onPress: async () => {
        await supabase.from('orders').update({ status: 'selesai' }).eq('id', orderId);
        await fetchOrders(tokoId, activeTab);
        await fetchCounts(tokoId);
      }},
    ]);
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
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => handleTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            {counts[tab.id] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                  {counts[tab.id]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Tidak ada pesanan</Text>
          <Text style={styles.emptyDesc}>Pesanan dengan status "{TABS.find(t => t.id === activeTab)?.label}" akan muncul di sini</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1565C0']} />}
        >
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('VendorDetailPesanan', { orderId: order.id })}
              activeOpacity={0.8}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{order.id.split('-')[0].toUpperCase()}</Text>
                <Text style={styles.orderTime}>
                  {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Items */}
              {order.order_items?.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemNama} numberOfLines={1}>{item.nama_menu}</Text>
                  <Text style={styles.itemQty}>x{item.qty}</Text>
                  <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.metode}>💳 {order.metode_bayar}</Text>
                  {order.catatan ? <Text style={styles.catatan} numberOfLines={1}>📝 {order.catatan}</Text> : null}
                </View>
                <Text style={styles.total}>Rp {order.total_harga.toLocaleString('id-ID')}</Text>
              </View>

              {/* Action Buttons */}
              {activeTab === 'menunggu' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.btnTolak} onPress={() => handleTolak(order.id)} activeOpacity={0.8}>
                    <Text style={styles.btnTolakText}>❌ Tolak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnTerima} onPress={() => handleTerima(order.id)} activeOpacity={0.8}>
                    <Text style={styles.btnTerimaText}>✅ Terima & Proses</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'diproses' && (
                <TouchableOpacity style={styles.btnSiap} onPress={() => handleSiap(order.id)} activeOpacity={0.8}>
                  <Text style={styles.btnSiapText}>🔔 Tandai Siap Diambil</Text>
                </TouchableOpacity>
              )}

              {activeTab === 'siap' && (
                <TouchableOpacity style={styles.btnSelesai} onPress={() => handleSelesai(order.id)} activeOpacity={0.8}>
                  <Text style={styles.btnSelesaiText}>✅ Tandai Sudah Diambil</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
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
  tabContainer: { paddingHorizontal: 16, gap: 4, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#F5F7FA' },
  tabActive: { backgroundColor: '#1565C0' },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabLabelActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#E0E0E0', borderRadius: 100, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  tabBadgeTextActive: { color: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  listContent: { padding: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  orderTime: { fontSize: 12, color: '#888' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemNama: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 10 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metode: { fontSize: 12, color: '#666' },
  catatan: { fontSize: 11, color: '#888', marginTop: 2, maxWidth: 200 },
  total: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnTolak: { flex: 1, backgroundColor: '#FFF3F3', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: '#EF5350' },
  btnTolakText: { color: '#EF5350', fontWeight: '700', fontSize: 13 },
  btnTerima: { flex: 2, backgroundColor: '#1565C0', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  btnTerimaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnSiap: { marginTop: 14, backgroundColor: '#E8F5E9', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: '#4CAF50' },
  btnSiapText: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  btnSelesai: { marginTop: 14, backgroundColor: '#E3F2FD', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: '#1565C0' },
  btnSelesaiText: { color: '#1565C0', fontWeight: '700', fontSize: 13 },
});