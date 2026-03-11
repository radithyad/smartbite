import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { useState } from 'react';

// ── DUMMY DATA ────────────────────────────────────────────
const DUMMY_MENU = [
  { id: 1, nama: 'Nasi Ayam Bakar', harga: 15000, emoji: '🍗', tersedia: true, terjual: 42, deskripsi: 'Nasi putih dengan ayam bakar bumbu kecap' },
  { id: 2, nama: 'Nasi Goreng Spesial', harga: 18000, emoji: '🍳', tersedia: true, terjual: 35, deskripsi: 'Nasi goreng dengan telur, ayam, dan sayuran' },
  { id: 3, nama: 'Mie Goreng', harga: 12000, emoji: '🍜', tersedia: true, terjual: 28, deskripsi: 'Mie goreng dengan bumbu rahasia' },
  { id: 4, nama: 'Nasi Rendang', harga: 20000, emoji: '🥩', tersedia: false, terjual: 19, deskripsi: 'Nasi dengan rendang daging sapi empuk' },
  { id: 5, nama: 'Nasi Soto', harga: 15000, emoji: '🍲', tersedia: true, terjual: 31, deskripsi: 'Soto ayam kuah kuning dengan nasi' },
  { id: 6, nama: 'Es Teh Manis', harga: 4000, emoji: '🧋', tersedia: true, terjual: 88, deskripsi: 'Teh manis dingin segar' },
  { id: 7, nama: 'Jus Jeruk', harga: 7000, emoji: '🍊', tersedia: true, terjual: 22, deskripsi: 'Jus jeruk segar tanpa pengawet' },
  { id: 8, nama: 'Ayam Geprek', harga: 16000, emoji: '🌶️', tersedia: false, terjual: 14, deskripsi: 'Ayam goreng geprek sambal level 1-5' },
];
// ─────────────────────────────────────────────────────────

export default function VendorMenuScreen({ navigation }) {
  const [menus, setMenus] = useState(DUMMY_MENU);
  const [filter, setFilter] = useState('semua');

  const toggleTersedia = (id) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, tersedia: !m.tersedia } : m));
  };

  const handleHapus = (id, nama) => {
    Alert.alert('Hapus Menu?', `"${nama}" akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => setMenus(prev => prev.filter(m => m.id !== id)) },
    ]);
  };

  const filtered = filter === 'semua' ? menus : filter === 'tersedia' ? menus.filter(m => m.tersedia) : menus.filter(m => !m.tersedia);

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kelola Menu</Text>
          <Text style={styles.headerSub}>{menus.length} menu · {menus.filter(m => m.tersedia).length} tersedia</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('VendorAddMenu')} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {[
          { id: 'semua',     label: '🍽️ Semua' },
          { id: 'tersedia',  label: '✅ Tersedia' },
          { id: 'habis',     label: '❌ Habis' },
        ].map(f => (
          <TouchableOpacity key={f.id} style={[styles.filterChip, filter === f.id && styles.filterChipActive]} onPress={() => setFilter(f.id)} activeOpacity={0.7}>
            <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Menu List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Tidak ada menu</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('VendorAddMenu')}>
              <Text style={styles.emptyBtnText}>+ Tambah Menu Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((menu) => (
            <View key={menu.id} style={[styles.menuCard, !menu.tersedia && styles.menuCardDim]}>

              {/* Top: emoji + info + toggle */}
              <View style={styles.menuCardTop}>
                <View style={styles.menuEmojiBox}>
                  <Text style={styles.menuEmoji}>{menu.emoji}</Text>
                </View>
                <View style={styles.menuInfo}>
                  <View style={styles.menuTopRow}>
                    <Text style={styles.menuNama} numberOfLines={1}>{menu.nama}</Text>
                    {!menu.tersedia && <View style={styles.habisTag}><Text style={styles.habisTagText}>Habis</Text></View>}
                  </View>
                  <Text style={styles.menuDeskripsi} numberOfLines={1}>{menu.deskripsi}</Text>
                  <View style={styles.menuBottomRow}>
                    <Text style={styles.menuHarga}>Rp {menu.harga.toLocaleString('id-ID')}</Text>
                    <Text style={styles.menuTerjual}>🔥 {menu.terjual}x terjual</Text>
                  </View>
                </View>
                <Switch
                  value={menu.tersedia}
                  onValueChange={() => toggleTersedia(menu.id)}
                  trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }}
                  thumbColor={menu.tersedia ? '#1565C0' : '#bbb'}
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>

              <View style={styles.divider} />

              {/* Bottom: edit + hapus */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOutlineGray]}
                  onPress={() => navigation.navigate('VendorEditMenu', { menuId: menu.id })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnTextGray}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOutlineRed]}
                  onPress={() => handleHapus(menu.id, menu.nama)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnTextRed}>🗑️ Hapus</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  addBtn: { backgroundColor: '#1565C0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E8ECF0' },
  filterChipActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#fff' },
  listContent: { padding: 16 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20 },
  emptyBtn: { backgroundColor: '#1565C0', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  menuCardDim: { opacity: 0.55 },
  menuCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  menuEmojiBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  menuEmoji: { fontSize: 28 },
  menuInfo: { flex: 1 },
  menuTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  menuNama: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', flex: 1 },
  habisTag: { backgroundColor: '#FFEBEE', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  habisTagText: { fontSize: 10, fontWeight: '700', color: '#C62828' },
  menuDeskripsi: { fontSize: 11, color: '#888', marginBottom: 5 },
  menuBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuHarga: { fontSize: 13, fontWeight: 'bold', color: '#1565C0' },
  menuTerjual: { fontSize: 11, color: '#888' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  btnOutlineGray: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E0E0' },
  btnTextGray: { color: '#555', fontWeight: '600', fontSize: 13 },
  btnOutlineRed: { backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#EF5350' },
  btnTextRed: { color: '#EF5350', fontWeight: '600', fontSize: 13 },
});