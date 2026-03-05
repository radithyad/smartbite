import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../service/supabase';

export default function VendorDashboardScreen({ navigation }) {
  const [toko, setToko] = useState(null);
  const [stats, setStats] = useState({ hariIni: 0, bulanIni: 0, totalOrder: 0, orderAktif: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ambil toko milik vendor ini
    const { data: tokoData } = await supabase
      .from('toko')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (!tokoData) { setLoading(false); return; }
    setToko(tokoData);

    const tokoId = tokoData.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Semua orders toko ini
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('toko_id', tokoId)
      .eq('status', 'selesai');

    // Order hari ini
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total_harga')
      .eq('toko_id', tokoId)
      .eq('status', 'selesai')
      .gte('created_at', startOfDay);

    // Order bulan ini
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('total_harga')
      .eq('toko_id', tokoId)
      .eq('status', 'selesai')
      .gte('created_at', startOfMonth);

    // Order aktif (menunggu + diproses + siap)
    const { data: aktifOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('toko_id', tokoId)
      .in('status', ['menunggu', 'diproses', 'siap']);

    // 5 order terbaru
    const { data: recent } = await supabase
      .from('orders')
      .select('*, order_items(nama_menu, qty)')
      .eq('toko_id', tokoId)
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      hariIni: todayOrders?.reduce((s, o) => s + o.total_harga, 0) || 0,
      bulanIni: monthOrders?.reduce((s, o) => s + o.total_harga, 0) || 0,
      totalOrder: allOrders?.length || 0,
      orderAktif: aktifOrders?.length || 0,
    });
    setRecentOrders(recent || []);
    setLoading(false);
  };

  const STATUS_COLOR = {
    menunggu:   { bg: '#FFF8E1', color: '#F57F17', label: 'Menunggu' },
    diproses:   { bg: '#E3F2FD', color: '#1565C0', label: 'Diproses' },
    siap:       { bg: '#E8F5E9', color: '#2E7D32', label: 'Siap' },
    selesai:    { bg: '#F5F5F5', color: '#888',    label: 'Selesai' },
    dibatalkan: { bg: '#FFEBEE', color: '#C62828', label: 'Dibatalkan' },
    ditolak:    { bg: '#FFEBEE', color: '#C62828', label: 'Ditolak' },
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1565C0" />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Selamat datang 👋</Text>
            <Text style={styles.headerTitle}>{toko?.nama || 'Toko Saya'}</Text>
            <View style={[styles.statusPill, { backgroundColor: toko?.aktif ? 'rgba(76,175,80,0.25)' : 'rgba(239,83,80,0.25)' }]}>
              <Text style={[styles.statusPillText, { color: toko?.aktif ? '#A5D6A7' : '#EF9A9A' }]}>
                {toko?.aktif ? '🟢 Toko Buka' : '🔴 Toko Tutup'}
              </Text>
            </View>
          </View>
          <Text style={styles.headerEmoji}>{toko?.emoji || '🏪'}</Text>
        </LinearGradient>

        <View style={styles.content}>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>Rp {(stats.hariIni / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>Pemasukan Hari Ini</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>Rp {(stats.bulanIni / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>Bulan Ini</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, { flex: 1 }]}
              onPress={() => navigation.navigate('VendorPesanan')}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>🛎️</Text>
              <Text style={[styles.statValue, stats.orderAktif > 0 && { color: '#E65100' }]}>
                {stats.orderAktif}
              </Text>
              <Text style={styles.statLabel}>Pesanan Aktif</Text>
              {stats.orderAktif > 0 && <View style={styles.alertDot} />}
            </TouchableOpacity>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{stats.totalOrder}</Text>
              <Text style={styles.statLabel}>Total Selesai</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('VendorPesanan')} activeOpacity={0.8}>
              <Text style={styles.quickBtnIcon}>🛎️</Text>
              <Text style={styles.quickBtnLabel}>Pesanan Masuk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('VendorTambahMenu')} activeOpacity={0.8}>
              <Text style={styles.quickBtnIcon}>➕</Text>
              <Text style={styles.quickBtnLabel}>Tambah Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('VendorToko')} activeOpacity={0.8}>
              <Text style={styles.quickBtnIcon}>⚙️</Text>
              <Text style={styles.quickBtnLabel}>Atur Toko</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Pesanan Terbaru</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VendorPesanan')}>
                  <Text style={styles.seeAll}>Lihat semua →</Text>
                </TouchableOpacity>
              </View>

              {recentOrders.map((order) => {
                const s = STATUS_COLOR[order.status] || STATUS_COLOR['menunggu'];
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('VendorDetailPesanan', { orderId: order.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.orderCardLeft}>
                      <Text style={styles.orderId}>#{order.id.split('-')[0].toUpperCase()}</Text>
                      <Text style={styles.orderItems} numberOfLines={1}>
                        {order.order_items?.map(i => `${i.nama_menu} x${i.qty}`).join(', ')}
                      </Text>
                      <Text style={styles.orderTime}>
                        {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.orderCardRight}>
                      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                      </View>
                      <Text style={styles.orderTotal}>Rp {order.total_harga.toLocaleString('id-ID')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  headerEmoji: { fontSize: 52, marginTop: 8 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, position: 'relative' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  alertDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E65100' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12, marginTop: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  seeAll: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  quickBtnIcon: { fontSize: 26, marginBottom: 6 },
  quickBtnLabel: { fontSize: 11, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  orderCardLeft: { flex: 1, marginRight: 12 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 3 },
  orderItems: { fontSize: 12, color: '#888', marginBottom: 3 },
  orderTime: { fontSize: 11, color: '#aaa' },
  orderCardRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#1565C0' },
});