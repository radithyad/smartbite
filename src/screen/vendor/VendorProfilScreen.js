import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../service/supabase';

// ── DUMMY DATA ────────────────────────────────────────────
const DUMMY_PROFIL = {
  nama: 'Bu Sari',
  username: 'bu_sari_warung',
  email: 'busari@email.com',
  no_hp: '+6281234567890',
};

const DUMMY_TOKO = {
  nama: 'Warung Bu Sari',
  kategori: 'Nasi & Lauk',
  emoji: '🍱',
  aktif: true,
};

const DUMMY_STATS = {
  totalSelesai: 128,
  totalPemasukan: 4320000,
  totalMenu: 8,
  rating: 4.8,
};
// ─────────────────────────────────────────────────────────

export default function VendorProfilScreen({ navigation }) {

  const handleLogout = () => {
    Alert.alert('Keluar?', 'Kamu yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const MenuItem = ({ emoji, label, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuItemEmoji}>{emoji}</Text>
      <Text style={[styles.menuItemLabel, danger && { color: '#EF5350' }]}>{label}</Text>
      <Text style={styles.menuItemChevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarEmoji}>{DUMMY_TOKO.emoji}</Text>
          </View>
          <Text style={styles.headerNama}>{DUMMY_PROFIL.nama}</Text>
          <Text style={styles.headerUsername}>@{DUMMY_PROFIL.username}</Text>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>⭐ {DUMMY_STATS.rating} · {DUMMY_TOKO.nama}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{DUMMY_STATS.totalSelesai}</Text>
              <Text style={styles.statLabel}>Pesanan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Rp {(DUMMY_STATS.totalPemasukan / 1000000).toFixed(1)}jt</Text>
              <Text style={styles.statLabel}>Pemasukan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{DUMMY_STATS.totalMenu}</Text>
              <Text style={styles.statLabel}>Menu Aktif</Text>
            </View>
          </View>

          {/* Toko info */}
          <View style={styles.tokoCard}>
            <View style={styles.tokoCardLeft}>
              <Text style={styles.tokoEmoji}>{DUMMY_TOKO.emoji}</Text>
              <View>
                <Text style={styles.tokoNama}>{DUMMY_TOKO.nama}</Text>
                <Text style={styles.tokoKategori}>{DUMMY_TOKO.kategori}</Text>
              </View>
            </View>
            <View style={[styles.tokoBadge, { backgroundColor: DUMMY_TOKO.aktif ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={[styles.tokoBadgeText, { color: DUMMY_TOKO.aktif ? '#2E7D32' : '#C62828' }]}>
                {DUMMY_TOKO.aktif ? '🟢 Buka' : '🔴 Tutup'}
              </Text>
            </View>
          </View>

          {/* Info akun */}
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <View style={styles.card}>
            {[
              { label: 'Email', value: DUMMY_PROFIL.email, icon: '📧' },
              { label: 'Nomor HP', value: DUMMY_PROFIL.no_hp, icon: '📱' },
              { label: 'Username', value: `@${DUMMY_PROFIL.username}`, icon: '👤' },
            ].map((item) => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Menu items */}
          <Text style={styles.sectionTitle}>Kelola</Text>
          <View style={styles.card}>
            <MenuItem emoji="🏪" label="Pengaturan Toko" onPress={() => navigation.navigate('VendorToko')} />
            <View style={styles.itemDivider} />
            <MenuItem emoji="🍽️" label="Kelola Menu" onPress={() => navigation.navigate('VendorMenu')} />
            <View style={styles.itemDivider} />
            <MenuItem emoji="📦" label="Pesanan Masuk" onPress={() => navigation.navigate('VendorPesanan')} />
            <View style={styles.itemDivider} />
            <MenuItem emoji="📊" label="Dashboard" onPress={() => navigation.navigate('VendorDashboard')} />
          </View>

          <View style={styles.card}>
            <MenuItem emoji="🚪" label="Logout" onPress={handleLogout} danger />
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingTop: 70, paddingBottom: 28, alignItems: 'center' },
  avatarWrapper: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 44 },
  headerNama: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerUsername: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  ratingPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  statsRow: { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingVertical: 18, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888' },
  statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },
  tokoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tokoCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tokoEmoji: { fontSize: 36 },
  tokoNama: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  tokoKategori: { fontSize: 12, color: '#888', marginTop: 2 },
  tokoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  tokoBadgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoIcon: { fontSize: 18, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 12 },
  menuItemEmoji: { fontSize: 20, width: 28 },
  menuItemLabel: { flex: 1, fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  menuItemChevron: { fontSize: 20, color: '#ccc' },
  itemDivider: { height: 1, backgroundColor: '#F5F5F5' },
});