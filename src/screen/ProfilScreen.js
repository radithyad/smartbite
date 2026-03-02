import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { supabase } from '../service/supabase';

export default function ProfilScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalPesanan: 0, totalBelanja: 0 });
  const [loading, setLoading] = useState(true);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [modGelap, setModeGelap] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
      fetchStats();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('total_harga')
      .eq('customer_id', user.id)
      .eq('status', 'selesai');
    if (data) {
      setStats({
        totalPesanan: data.length,
        totalBelanja: data.reduce((sum, o) => sum + o.total_harga, 0),
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah kamu yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => { await supabase.auth.signOut(); },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  const MenuItem = ({ emoji, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  const MenuDivider = () => <View style={styles.menuDivider} />;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1565C0', '#42A5F5',  '#1565C0']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => {
                if (profile?.foto_url) setShowFotoModal(true);
              }}
              activeOpacity={0.8}
            >
              {profile?.foto_url ? (
                <Image source={{ uri: profile.foto_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.namaUser}>{profile?.nama || '-'}</Text>
          <Text style={styles.usernameUser}>@{profile?.username || '-'}</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.totalPesanan}</Text>
              <Text style={styles.statLabel}>Pesanan Selesai</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {stats.totalBelanja >= 1000
                  ? `Rp ${(stats.totalBelanja / 1000).toFixed(0)}k`
                  : `Rp ${stats.totalBelanja}`}
              </Text>
              <Text style={styles.statLabel}>Total Belanja</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* Preferensi */}
          <Text style={styles.sectionLabel}>Preferensi</Text>
          <View style={styles.card}>
            <MenuItem
              emoji="👤"
              label="Edit Profil"
              onPress={() => navigation.navigate('EditProfil')}
            />
          </View>

          {/* Riwayat & Aktivitas */}
          <Text style={styles.sectionLabel}>Riwayat & Aktivitas</Text>
          <View style={styles.card}>
            <MenuItem
              emoji="⚡"
              label="Aktivitas"
              onPress={() => navigation.navigate('Main', { screen: 'Aktivitas' })}
            />
            <MenuDivider />
            <MenuItem
              emoji="🕐"
              label="Riwayat Pesanan"
              onPress={() => navigation.navigate('Main', { screen: 'Riwayat' })}
            />
          </View>

          {/* Lainnya */}
          <Text style={styles.sectionLabel}>Lainnya</Text>
          <View style={styles.card}>

            {/* Mode Gelap - pakai Toggle */}
            <View style={styles.menuItem}>
              <Text style={styles.menuEmoji}>🌙</Text>
              <Text style={styles.menuLabel}>Mode Gelap</Text>
              <Switch
                value={modGelap}
                onValueChange={(val) => {
                  setModeGelap(val);
                  Alert.alert('Mode Gelap', 'Fitur ini akan segera hadir!');
                }}
                trackColor={{ false: '#E0E0E0', true: '#1565C0' }}
                thumbColor={modGelap ? '#fff' : '#fff'}
              />
            </View>

            <MenuDivider />

            <MenuItem
              emoji="⭐"
              label="Beri Rating Aplikasi"
              onPress={() => Alert.alert('Rating', 'Terima kasih sudah mau memberi rating!')}
            />

            <MenuDivider />

            {/* Keluar - warna merah */}
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.menuEmoji}>🚪</Text>
              <Text style={[styles.menuLabel, { color: '#EF5350' }]}>Keluar dari Akun</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.versionText}>SmartBite v1.0.0</Text>
          <View style={{ height: 30 }} />
        </View>

      </ScrollView>

      {/* Modal Preview Foto */}
      <Modal
        visible={showFotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFotoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFotoModal(false)}
        >
          <View style={styles.modalContent}>
            <Image
              source={{ uri: profile?.foto_url }}
              style={styles.modalFoto}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
    marginTop: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  namaUser: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  usernameUser: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  noHpUser: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
    marginTop: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 14,
  },
  menuEmoji: {
    fontSize: 20,
    width: 26,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  menuArrow: {
    fontSize: 22,
    color: '#ccc',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 40,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    gap: 20,
  },
  modalFoto: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalEditText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});