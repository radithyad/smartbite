import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../service/supabase';

export default function VendorAddMenuScreen({ navigation }) {
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [harga, setHarga] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [fotoUrl, setFotoUrl] = useState(null);
  const [tersedia, setTersedia] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [tokoId, setTokoId] = useState(null);

  useEffect(() => { fetchToko(); }, []);

  const fetchToko = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: toko } = await supabase.from('toko').select('id').eq('owner_id', user.id).single();
    if (toko) setTokoId(toko.id);
  };

  const handlePilihFoto = () => {
    Alert.alert('Foto Menu', 'Pilih sumber foto', [
      { text: '📷 Kamera', onPress: () => ambilFoto('camera') },
      { text: '🖼 Galeri', onPress: () => ambilFoto('gallery') },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const ambilFoto = async (source) => {
    let result;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan'); return; }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    }
    if (result.canceled) return;

    setUploadingFoto(true);
    try {
      const uri = result.assets[0].uri;
      const fileName = `menu_${tokoId}_${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsArrayBuffer(blob);
      });
      const { error } = await supabase.storage.from('foto-menu').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) { Alert.alert('Upload gagal', error.message); setUploadingFoto(false); return; }
      const { data: urlData } = supabase.storage.from('foto-menu').getPublicUrl(fileName);
      setFotoUrl(urlData.publicUrl + '?t=' + Date.now());
    } catch (e) {
      Alert.alert('Error', 'Gagal upload foto');
    }
    setUploadingFoto(false);
  };

  const handleSimpan = async () => {
    if (!nama.trim()) { Alert.alert('Oops!', 'Nama menu wajib diisi.'); return; }
    if (!harga || isNaN(Number(harga))) { Alert.alert('Oops!', 'Harga harus berupa angka.'); return; }
    if (!tokoId) { Alert.alert('Error', 'Toko tidak ditemukan.'); return; }

    setSaving(true);
    const { error } = await supabase.from('menu').insert({
      toko_id: tokoId,
      nama: nama.trim(),
      deskripsi: deskripsi.trim(),
      harga: Number(harga),
      emoji,
      foto_url: fotoUrl ? fotoUrl.split('?')[0] : null,
      tersedia,
    });

    setSaving(false);
    if (error) { Alert.alert('Gagal', error.message); return; }
    Alert.alert('Berhasil! 🎉', 'Menu baru berhasil ditambahkan.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Menu</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Foto */}
        <TouchableOpacity style={styles.fotoUpload} onPress={handlePilihFoto} activeOpacity={0.8}>
          {uploadingFoto ? (
            <ActivityIndicator color="#1565C0" />
          ) : fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.fotoPreview} resizeMode="cover" />
          ) : (
            <>
              <Text style={styles.fotoIcon}>📷</Text>
              <Text style={styles.fotoLabel}>Tap untuk upload foto menu</Text>
              <Text style={styles.fotoSub}>Disarankan rasio 4:3</Text>
            </>
          )}
        </TouchableOpacity>
        {fotoUrl && (
          <TouchableOpacity onPress={handlePilihFoto} style={styles.gantiBtn}>
            <Text style={styles.gantiBtnText}>🔄 Ganti Foto</Text>
          </TouchableOpacity>
        )}

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Informasi Menu</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nama Menu *</Text>
            <TextInput style={styles.input} placeholder="Contoh: Nasi Goreng Spesial" placeholderTextColor="#aaa" value={nama} onChangeText={setNama} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Deskripsi</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Deskripsi singkat menu..." placeholderTextColor="#aaa" value={deskripsi} onChangeText={setDeskripsi} multiline numberOfLines={3} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Harga (Rp) *</Text>
            <TextInput style={styles.input} placeholder="Contoh: 15000" placeholderTextColor="#aaa" value={harga} onChangeText={setHarga} keyboardType="number-pad" />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Emoji (opsional)</Text>
            <TextInput style={styles.input} placeholder="🍽️" placeholderTextColor="#aaa" value={emoji} onChangeText={setEmoji} />
          </View>
        </View>

        {/* Toggle Tersedia */}
        <View style={styles.card}>
          <View style={styles.tersediaRow}>
            <View>
              <Text style={styles.cardTitle}>Ketersediaan</Text>
              <Text style={styles.tersediaDesc}>Menu akan {tersedia ? 'terlihat' : 'tersembunyi'} dari customer</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, tersedia ? styles.toggleOn : styles.toggleOff]}
              onPress={() => setTersedia(!tersedia)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, tersedia ? styles.toggleTextOn : styles.toggleTextOff]}>
                {tersedia ? '✅ Tersedia' : '❌ Habis'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSimpan} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>💾 Simpan Menu</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 26, color: '#1A1A1A', lineHeight: 30, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  content: { padding: 16 },
  fotoUpload: { backgroundColor: '#fff', borderRadius: 16, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: '#1565C0', overflow: 'hidden' },
  fotoPreview: { width: '100%', height: '100%' },
  fotoIcon: { fontSize: 40, marginBottom: 8 },
  fotoLabel: { fontSize: 14, fontWeight: '600', color: '#1565C0', marginBottom: 4 },
  fotoSub: { fontSize: 12, color: '#888' },
  gantiBtn: { alignSelf: 'center', marginBottom: 16 },
  gantiBtnText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 14 },
  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 7 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#1A1A1A', borderWidth: 1, borderColor: '#E8ECF0' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  tersediaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tersediaDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  toggleBtn: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  toggleOn: { backgroundColor: '#E8F5E9' },
  toggleOff: { backgroundColor: '#FFEBEE' },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextOn: { color: '#2E7D32' },
  toggleTextOff: { color: '#C62828' },
  saveButton: { borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});