import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../service/supabase';

export default function VendorProfilScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [toko, setToko] = useState(null);
  const [stats, setStats] = useState({ totalSelesai: 0, totalPemasukan: 0, totalMenu: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: tokoData } = await supabase.from('toko').select('*').eq('owner_id', user.id).single();

    setProfile(profileData);
    setToko(tokoData);

    if (tokoData) {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_harga')
        .eq('toko_id', tokoData.id)
        .eq('status', 'selesai');

      const { count: menuCount } = await supabase
        .from('menu')
        .select('id', { count: 'exact', head: true })
        .eq('toko_id', tokoData.id);

      setStats({
        totalSelesai: orders?.length || 0,
        totalPemasukan: orders?.reduce((s, o) => s + o.total_harga, 0) || 0,
        totalMenu: menuCount || 0,
      });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert('Keluar?', 'Kamu akan keluar dari akun ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1565C0" /></View>;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header Profil */}
        <View style={styles.profileHeader}>
          {profile?.foto_url ? (
            <Image source={{ uri: profile.foto_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 36 }}>👤</Text>
            </View>
          )}
          <Text style={styles.nama}>{profile?.nama || 'Penjual'}</Text>
          <Text style={styles.username}>@{profile?.username || '-'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>🏪 Vendor</Text>
          </View>
        </View>

        <View style={styles.content}>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSelesai}</Text>
              <Text style={styles.statLabel}>Order Selesai</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                Rp {stats.totalPemasukan >= 1000000
                  ? (stats.totalPemasukan / 1000000).toFixed(1) + 'jt'
                  : (stats.totalPemasukan / 1000).toFixed(0) + 'k'}
              </Text>
              <Text style={styles.statLabel}>Total Pemasukan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalMenu}</Text>
              <Text style={styles.statLabel}>Menu Aktif</Text>
            </View>
          </View>

          {/* Info Toko */}
          {toko && (
            <View style={styles.tokoCard}>
              <Text style={styles.tokoEmoji}>{toko.emoji || '🏪'}</Text>
              <View style={styles.tokoInfo}>
                <Text style={styles.tokoNama}>{toko.nama}</Text>
                <Text style={styles.tokoKategori}>{toko.kategori}</Text>
                <View style={[styles.tokoStatusBadge, { backgroundColor: toko.aktif ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.tokoStatusText, { color: toko.aktif ? '#2E7D32' : '#C62828' }]}>
                    {toko.aktif ? '🟢 Buka' : '🔴 Tutup'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editTokoBtn}
                onPress={() => navigation.navigate('VendorToko')}
                activeOpacity={0.8}
              >
                <Text style={styles.editTokoBtnText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Menu Section */}
          <Text style={styles.sectionLabel}>AKUN</Text>
          <View style={styles.menuCard}>
            <MenuItem emoji="🏪" label="Pengaturan Toko" onPress={() => navigation.navigate('VendorToko')} />
            <View style={styles.menuDivider} />
            <MenuItem emoji="🍽️" label="Kelola Menu" onPress={() => navigation.navigate('VendorMenu')} />
            <View style={styles.menuDivider} />
            <MenuItem emoji="🛎️" label="Pesanan Masuk" onPress={() => navigation.navigate('VendorPesanan')} />
          </View>

          <Text style={styles.sectionLabel}>LAINNYA</Text>
          <View style={styles.menuCard}>
            <MenuItem emoji="📊" label="Dashboard Statistik" onPress={() => navigation.navigate('VendorDashboard')} />
            <View style={styles.menuDivider} />
            <MenuItem emoji="🚪" label="Keluar dari Akun" onPress={handleLogout} labelColor="#EF5350" />
          </View>

          <Text style={styles.versionText}>SmartBite Vendor v1.0.0</Text>
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ emoji, label, onPress, labelColor }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuItemEmoji}>{emoji}</Text>
      <Text style={[styles.menuItemLabel, labelColor && { color: labelColor }]}>{label}</Text>
      <Text style={styles.menuItemChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#BBDEFB', marginBottom: 12 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#BBDEFB', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  nama: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  username: { fontSize: 13, color: '#888', marginBottom: 10 },
  roleBadge: { backgroundColor: '#E3F2FD', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5 },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: '#1565C0' },
  content: { padding: 20 },
  statsRow: { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingVertical: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: 'bold', color: '#1565C0', marginBottom: 3 },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#F0F0F0' },
  tokoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tokoEmoji: { fontSize: 36, marginRight: 12 },
  tokoInfo: { flex: 1 },
  tokoNama: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 2 },
  tokoKategori: { fontSize: 12, color: '#888', marginBottom: 6 },
  tokoStatusBadge: { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  tokoStatusText: { fontSize: 11, fontWeight: '700' },
  editTokoBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  editTokoBtnText: { fontSize: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  menuItemEmoji: { fontSize: 20, width: 32, textAlign: 'center', marginRight: 12 },
  menuItemLabel: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  menuItemChevron: { fontSize: 22, color: '#ccc' },
  menuDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 60 },
  versionText: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 4 },
});