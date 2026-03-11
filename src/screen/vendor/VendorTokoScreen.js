import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../service/supabase';

export default function VendorTokoScreen() {
  const [toko, setToko] = useState(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState('');
  const [emoji, setEmoji] = useState('🏪');
  const [jamBuka, setJamBuka] = useState('');
  const [jamTutup, setJamTutup] = useState('');
  const [waktu, setWaktu] = useState('');
  const [aktif, setAktif] = useState(true);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useFocusEffect(useCallback(() => { fetchToko(); }, []));

  const fetchToko = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('toko').select('*').eq('user_id', user.id).single();
    if (data) {
      setToko(data);
      setNama(data.nama || '');
      setDeskripsi(data.deskripsi || '');
      setKategori(data.kategori || '');
      setEmoji(data.emoji || '🏪');
      setJamBuka(data.jam_buka || '');
      setJamTutup(data.jam_tutup || '');
      setWaktu(data.waktu || '');
      setAktif(data.aktif ?? true);
      setFotoUrl(data.foto_url || null);
    }
    setLoading(false);
  };

  const handlePilihFoto = () => {
    Alert.alert('Foto Toko', 'Pilih sumber foto', [
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
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    }
    if (result.canceled) return;

    setUploadingFoto(true);
    try {
      const uri = result.assets[0].uri;
      const fileName = `toko_${toko.id}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsArrayBuffer(blob);
      });
      const { error } = await supabase.storage.from('foto-toko').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) { Alert.alert('Upload gagal', error.message); setUploadingFoto(false); return; }
      const { data: urlData } = supabase.storage.from('foto-toko').getPublicUrl(fileName);
      setFotoUrl(urlData.publicUrl + '?t=' + Date.now());
    } catch (e) {
      Alert.alert('Error', 'Gagal upload foto');
    }
    setUploadingFoto(false);
  };

  const handleSimpan = async () => {
    if (!nama.trim()) { Alert.alert('Oops!', 'Nama toko wajib diisi.'); return; }
    setSaving(true);
    const { error } = await supabase.from('toko').update({
      nama: nama.trim(),
      deskripsi: deskripsi.trim(),
      kategori: kategori.trim(),
      emoji,
      jam_buka: jamBuka.trim(),
      jam_tutup: jamTutup.trim(),
      waktu: waktu.trim(),
      aktif,
      foto_url: fotoUrl ? fotoUrl.split('?')[0] : null,
    }).eq('id', toko.id);
    setSaving(false);
    if (error) { Alert.alert('Gagal', error.message); return; }
    Alert.alert('Berhasil! ✅', 'Info toko berhasil diperbarui.');
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1565C0" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengaturan Toko</Text>
        <Text style={styles.headerSub}>Kelola info dan tampilan tokomu</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Foto Toko */}
        <TouchableOpacity style={styles.fotoUpload} onPress={handlePilihFoto} activeOpacity={0.8}>
          {uploadingFoto ? (
            <View style={styles.fotoPlaceholder}><ActivityIndicator color="#1565C0" /></View>
          ) : fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.fotoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.fotoEmoji}>{emoji}</Text>
              <Text style={styles.fotoLabel}>Tap untuk upload foto toko</Text>
              <Text style={styles.fotoSub}>Disarankan rasio 16:9</Text>
            </View>
          )}
          <View style={styles.fotoBadge}>
            <Text style={styles.fotoBadgeText}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* Status Toko */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Text style={styles.switchLabel}>Status Toko</Text>
              <Text style={[styles.switchDesc, { color: aktif ? '#2E7D32' : '#C62828' }]}>
                {aktif ? '🟢 Toko sedang buka' : '🔴 Toko sedang tutup'}
              </Text>
            </View>
            <Switch
              value={aktif}
              onValueChange={setAktif}
              trackColor={{ false: '#FFCDD2', true: '#C8E6C9' }}
              thumbColor={aktif ? '#4CAF50' : '#EF5350'}
            />
          </View>
        </View>

        {/* Info Toko */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 Informasi Toko</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nama Toko *</Text>
            <TextInput style={styles.input} placeholder="Nama tokomu" placeholderTextColor="#aaa" value={nama} onChangeText={setNama} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Deskripsi</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Ceritakan tokomu..." placeholderTextColor="#aaa" value={deskripsi} onChangeText={setDeskripsi} multiline numberOfLines={3} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <TextInput style={styles.input} placeholder="Contoh: Nasi, Mie, Minuman" placeholderTextColor="#aaa" value={kategori} onChangeText={setKategori} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Emoji Toko</Text>
            <TextInput style={styles.input} placeholder="🏪" placeholderTextColor="#aaa" value={emoji} onChangeText={setEmoji} />
          </View>
        </View>

        {/* Jam Operasional */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🕐 Jam Operasional</Text>

          <View style={styles.jamRow}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Jam Buka</Text>
              <TextInput style={styles.input} placeholder="08:00" placeholderTextColor="#aaa" value={jamBuka} onChangeText={setJamBuka} />
            </View>
            <Text style={styles.jamSep}>–</Text>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Jam Tutup</Text>
              <TextInput style={styles.input} placeholder="17:00" placeholderTextColor="#aaa" value={jamTutup} onChangeText={setJamTutup} />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Estimasi Waktu Siap</Text>
            <TextInput style={styles.input} placeholder="Contoh: 10-15 menit" placeholderTextColor="#aaa" value={waktu} onChangeText={setWaktu} />
          </View>
        </View>

        {/* Simpan */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSimpan} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>💾 Simpan Perubahan</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  content: { padding: 16 },
  fotoUpload: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  fotoPlaceholder: { flex: 1, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  fotoPreview: { width: '100%', height: '100%' },
  fotoEmoji: { fontSize: 48, marginBottom: 8 },
  fotoLabel: { fontSize: 14, fontWeight: '600', color: '#1565C0', marginBottom: 4 },
  fotoSub: { fontSize: 12, color: '#888' },
  fotoBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#fff', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
  fotoBadgeText: { fontSize: 18 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLeft: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 3 },
  switchDesc: { fontSize: 12, fontWeight: '600' },
  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 7 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#1A1A1A', borderWidth: 1, borderColor: '#E8ECF0' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  jamRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  jamSep: { fontSize: 18, color: '#888', marginTop: 24 },
  saveButton: { borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});