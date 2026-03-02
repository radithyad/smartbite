import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../service/supabase';

const COUNTRY_CODES = [
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
];

export default function EditProfilScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [gantiPassword, setGantiPassword] = useState(false);
  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) || c.code.includes(searchCountry)
  );

  useEffect(() => { fetchProfil(); }, []);

  const fetchProfil = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setOriginalData(data);
      setNama(data.nama || '');
      setUsername(data.username || '');
      setEmail(data.email || '');
      setFotoUrl(data.foto_url || null);
      if (data.no_hp) {
        const country = COUNTRY_CODES.find(c => data.no_hp.startsWith(c.code));
        if (country) { setSelectedCountry(country); setNoHp(data.no_hp.replace(country.code, '')); }
        else setNoHp(data.no_hp);
      }
    }
    setLoading(false);
  };

  const handlePilihFoto = () => {
    Alert.alert('Ganti Foto Profil', 'Pilih sumber foto', [
      { text: '📷 Kamera', onPress: () => ambilFoto('camera') },
      { text: '🖼 Galeri', onPress: () => ambilFoto('gallery') },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const ambilFoto = async (source) => {
    let result;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('Izin Diperlukan', 'Izinkan akses kamera terlebih dahulu.'); return; }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Izin Diperlukan', 'Izinkan akses galeri terlebih dahulu.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    }
    if (result.canceled) return;
    setUploadingFoto(true);
    try {
      const uri = result.assets[0].uri;
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `foto_profil_${user.id}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      const { error } = await supabase.storage.from('foto-profil').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) { Alert.alert('Upload Gagal', error.message); setUploadingFoto(false); return; }
      const { data: urlData } = supabase.storage.from('foto-profil').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      setFotoUrl(publicUrl);
      await supabase.from('profiles').update({ foto_url: urlData.publicUrl }).eq('id', user.id);
      setUploadingFoto(false);
      Alert.alert('Berhasil!', 'Foto profil berhasil diperbarui!');
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan saat upload foto.');
      setUploadingFoto(false);
    }
  };

  const handleSimpan = async () => {
    if (!nama.trim()) { Alert.alert('Oops!', 'Nama tidak boleh kosong.'); return; }
    if (!username.trim()) { Alert.alert('Oops!', 'Username tidak boleh kosong.'); return; }
    if (username.includes(' ')) { Alert.alert('Oops!', 'Username tidak boleh mengandung spasi.'); return; }
    if (noHp && noHp.length < 9) { Alert.alert('Oops!', 'Nomor HP minimal 9 angka.'); return; }
    if (gantiPassword) {
      if (!passwordLama) { Alert.alert('Oops!', 'Masukkan password lama kamu.'); return; }
      if (passwordBaru.length < 6) { Alert.alert('Oops!', 'Password baru minimal 6 karakter.'); return; }
      if (passwordBaru !== konfirmasiPassword) { Alert.alert('Oops!', 'Konfirmasi password tidak sama.'); return; }
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fullNoHp = noHp ? selectedCountry.code + noHp : '';
      if (username.toLowerCase() !== originalData.username) {
        const { data: ex } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle();
        if (ex) { Alert.alert('Oops!', 'Username sudah dipakai, coba username lain.'); setSaving(false); return; }
      }
      if (fullNoHp && fullNoHp !== originalData.no_hp) {
        const { data: exHp } = await supabase.from('profiles').select('id').eq('no_hp', fullNoHp).maybeSingle();
        if (exHp) { Alert.alert('Oops!', 'Nomor HP sudah terdaftar.'); setSaving(false); return; }
      }
      const { error: profileError } = await supabase.from('profiles').update({ nama: nama.trim(), username: username.toLowerCase().trim(), no_hp: fullNoHp }).eq('id', user.id);
      if (profileError) { Alert.alert('Gagal', profileError.message); setSaving(false); return; }
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) { Alert.alert('Gagal Update Email', emailError.message); setSaving(false); return; }
        await supabase.from('profiles').update({ email }).eq('id', user.id);
      }
      if (gantiPassword && passwordBaru) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordLama });
        if (loginError) { Alert.alert('Password Lama Salah', 'Password lama yang kamu masukkan tidak sesuai.'); setSaving(false); return; }
        const { error: passError } = await supabase.auth.updateUser({ password: passwordBaru });
        if (passError) { Alert.alert('Gagal Update Password', passError.message); setSaving(false); return; }
      }
      setSaving(false);
      Alert.alert('Berhasil! 🎉', 'Profil kamu berhasil diperbarui!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan, coba lagi.');
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1565C0" /></View>;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePilihFoto} activeOpacity={0.8}>
            {uploadingFoto ? (
              <View style={styles.avatarCircle}><ActivityIndicator color="#1565C0" /></View>
            ) : fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>👤</Text></View>
            )}
            <View style={styles.editFotoBadge}>
              <Text style={styles.editFotoText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.tapFotoText}>Tap foto untuk mengganti</Text>
        </View>

        {/* Informasi Dasar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Informasi Dasar</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput style={styles.input} placeholder="Masukkan nama lengkap" placeholderTextColor="#aaa" value={nama} onChangeText={setNama} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput style={styles.input} placeholder="Contoh: budi123" placeholderTextColor="#aaa" autoCapitalize="none" value={username} onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, ''))} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} placeholder="Masukkan email" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nomor HP</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity style={styles.countryButton} onPress={() => setShowCountryModal(true)} activeOpacity={0.7}>
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Text style={styles.countryChevron}>▾</Text>
              </TouchableOpacity>
              <TextInput style={styles.phoneInput} placeholder="8123456789" placeholderTextColor="#aaa" keyboardType="phone-pad" value={noHp} onChangeText={(t) => setNoHp(t.replace(/[^0-9]/g, ''))} />
            </View>
            {noHp.length > 0 && noHp.length < 9 && <Text style={styles.errorHint}>⚠️ Minimal 9 angka</Text>}
          </View>
        </View>

        {/* Ganti Password */}
        <View style={styles.card}>
          <View style={styles.passwordHeader}>
            <Text style={styles.cardTitle}>🔒 Ganti Password</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, gantiPassword && styles.toggleBtnActive]}
              onPress={() => { setGantiPassword(!gantiPassword); setPasswordLama(''); setPasswordBaru(''); setKonfirmasiPassword(''); }}
            >
              <Text style={[styles.toggleText, gantiPassword && styles.toggleTextActive]}>{gantiPassword ? 'Batal' : 'Ubah'}</Text>
            </TouchableOpacity>
          </View>

          {gantiPassword ? (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password Lama</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={styles.passwordInput} placeholder="Masukkan password lama" placeholderTextColor="#aaa" secureTextEntry={!showPasswordLama} value={passwordLama} onChangeText={setPasswordLama} />
                  <TouchableOpacity onPress={() => setShowPasswordLama(!showPasswordLama)}>
                    <Text style={styles.eyeIcon}>{showPasswordLama ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password Baru</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={styles.passwordInput} placeholder="Minimal 6 karakter" placeholderTextColor="#aaa" secureTextEntry={!showPasswordBaru} value={passwordBaru} onChangeText={setPasswordBaru} />
                  <TouchableOpacity onPress={() => setShowPasswordBaru(!showPasswordBaru)}>
                    <Text style={styles.eyeIcon}>{showPasswordBaru ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={styles.passwordInput} placeholder="Ulangi password baru" placeholderTextColor="#aaa" secureTextEntry={!showKonfirmasi} value={konfirmasiPassword} onChangeText={setKonfirmasiPassword} />
                  <TouchableOpacity onPress={() => setShowKonfirmasi(!showKonfirmasi)}>
                    <Text style={styles.eyeIcon}>{showKonfirmasi ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {konfirmasiPassword.length > 0 && passwordBaru !== konfirmasiPassword && (
                  <Text style={styles.errorHint}>⚠️ Password tidak sama</Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.passwordHint}>Klik "Ubah" untuk mengganti password kamu</Text>
          )}
        </View>

        {/* Tombol Simpan */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSimpan} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>💾 Simpan Perubahan</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Kode Negara */}
      <Modal visible={showCountryModal} animationType="slide" transparent onRequestClose={() => setShowCountryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cari kode negara</Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchIconText}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="Ketik nama atau kode negara" placeholderTextColor="#aaa" value={searchCountry} onChangeText={setSearchCountry} autoFocus />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => { setSelectedCountry(item); setShowCountryModal(false); setSearchCountry(''); }} activeOpacity={0.7}>
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countrySeparator} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#BBDEFB' },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#BBDEFB' },
  avatarEmoji: { fontSize: 44 },
  editFotoBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  editFotoText: { fontSize: 14 },
  tapFotoText: { fontSize: 12, color: '#888' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },

  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0' },

  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  countryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E8ECF0', gap: 4 },
  countryFlag: { fontSize: 18 },
  countryCode: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  countryChevron: { fontSize: 10, color: '#888' },
  phoneInput: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0' },
  errorHint: { fontSize: 12, color: '#EF5350', marginTop: 6, marginLeft: 4 },

  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toggleBtn: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  toggleBtnActive: { backgroundColor: '#FFEBEE' },
  toggleText: { color: '#1565C0', fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: '#EF5350' },
  passwordHint: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingBottom: 4 },
  passwordRow: { flexDirection: 'row', backgroundColor: '#F5F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#E8ECF0', alignItems: 'center', paddingHorizontal: 16 },
  passwordInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1a1a1a' },
  eyeIcon: { fontSize: 18, padding: 4 },

  saveButton: { borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E8ECF0' },
  searchIconText: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  countryItemFlag: { fontSize: 24 },
  countryItemName: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  countryItemCode: { fontSize: 14, color: '#888', fontWeight: '600' },
  countrySeparator: { height: 1, backgroundColor: '#F5F5F5' },
});