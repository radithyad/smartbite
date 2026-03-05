import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../service/supabase';

export default function VendorMenuScreen({ navigation }) {
  const [menuList, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokoId, setTokoId] = useState(null);

  useFocusEffect(useCallback(() => { init(); }, []));

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: toko } = await supabase.from('toko').select('id').eq('owner_id', user.id).single();
    if (toko) { setTokoId(toko.id); await fetchMenu(toko.id); }
    setLoading(false);
  };

  const fetchMenu = async (tid) => {
    const { data } = await supabase
      .from('menu')
      .select('*')
      .eq('toko_id', tid || tokoId)
      .order('tersedia', { ascending: false })
      .order('nama', { ascending: true });
    setMenuList(data || []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  };

  const toggleTersedia = async (menu) => {
    await supabase.from('menu').update({ tersedia: !menu.tersedia }).eq('id', menu.id);
    await fetchMenu();
  };

  const handleHapus = (menu) => {
    Alert.alert('Hapus Menu?', `"${menu.nama}" akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await supabase.from('menu').delete().eq('id', menu.id);
        await fetchMenu();
      }},
    ]);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1565C0" /></View>;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kelola Menu</Text>
          <Text style={styles.headerSub}>{menuList.length} menu terdaftar</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('VendorTambahMenu')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {menuList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Belum ada menu</Text>
          <Text style={styles.emptyDesc}>Tambahkan menu pertama tokomu sekarang!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('VendorTambahMenu')} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>+ Tambah Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1565C0']} />}
        >
          {menuList.map((menu) => (
            <View key={menu.id} style={[styles.menuCard, !menu.tersedia && styles.menuCardTidakTersedia]}>

              {/* Foto/Emoji */}
              {menu.foto_url ? (
                <Image source={{ uri: menu.foto_url }} style={styles.menuImage} resizeMode="cover" />
              ) : (
                <View style={styles.menuEmojiBox}>
                  <Text style={styles.menuEmoji}>{menu.emoji || '🍽️'}</Text>
                </View>
              )}

              {/* Info */}
              <View style={styles.menuInfo}>
                <View style={styles.menuInfoTop}>
                  <Text style={styles.menuNama} numberOfLines={1}>{menu.nama}</Text>
                  {/* Toggle Tersedia */}
                  <TouchableOpacity
                    style={[styles.toggleBtn, menu.tersedia ? styles.toggleBtnOn : styles.toggleBtnOff]}
                    onPress={() => toggleTersedia(menu)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, menu.tersedia ? styles.toggleTextOn : styles.toggleTextOff]}>
                      {menu.tersedia ? 'Tersedia' : 'Habis'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.menuDeskripsi} numberOfLines={1}>{menu.deskripsi || '-'}</Text>
                <Text style={styles.menuHarga}>Rp {menu.harga.toLocaleString('id-ID')}</Text>

                {/* Edit & Hapus */}
                <View style={styles.menuActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('VendorEditMenu', { menu })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.hapusBtn}
                    onPress={() => handleHapus(menu)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.hapusBtnText}>🗑️ Hapus</Text>
                  </TouchableOpacity>
                </View>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  addButton: { backgroundColor: '#1565C0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: '#1565C0', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: 16 },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  menuCardTidakTersedia: { opacity: 0.6 },
  menuImage: { width: 100, height: '100%', minHeight: 110 },
  menuEmojiBox: { width: 100, minHeight: 110, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  menuEmoji: { fontSize: 36 },
  menuInfo: { flex: 1, padding: 12 },
  menuInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  menuNama: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', flex: 1, marginRight: 8 },
  toggleBtn: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  toggleBtnOn: { backgroundColor: '#E8F5E9' },
  toggleBtnOff: { backgroundColor: '#FFEBEE' },
  toggleText: { fontSize: 11, fontWeight: '700' },
  toggleTextOn: { color: '#2E7D32' },
  toggleTextOff: { color: '#C62828' },
  menuDeskripsi: { fontSize: 12, color: '#888', marginBottom: 6 },
  menuHarga: { fontSize: 14, fontWeight: 'bold', color: '#1565C0', marginBottom: 10 },
  menuActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#1565C0' },
  hapusBtn: { backgroundColor: '#FFEBEE', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  hapusBtnText: { fontSize: 12, fontWeight: '600', color: '#C62828' },
});