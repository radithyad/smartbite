import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, Platform } from 'react-native';
import { useState, useEffect } from 'react'
import { supabase } from './src/service/supabase';
import { registerForPushNotifications } from './src/service/notification';

// ── Customer Screens ──────────────────────────────────────
import LoginScreen from './src/screen/LoginScreen';
import RegisterScreen from './src/screen/RegisterScreen';
import HomeScreen from './src/screen/HomeScreen';
import DetailTokoScreen from './src/screen/DetailTokoScreen';
import KeranjangScreen from './src/screen/KeranjangScreen';
import CheckoutScreen from './src/screen/CheckoutScreen';
import StatusOrderScreen from './src/screen/StatusOrderScreen';
import RiwayatScreen from './src/screen/RiwayatScreen';
import ProfilScreen from './src/screen/ProfilScreen';
import AktivitasScreen from './src/screen/AktivitasScreen';
import SearchScreen from './src/screen/SearchScreen';
import UlasanScreen from './src/screen/UlasanScreen';
import SplashScreen from './src/screen/SplashScreen';
import EditProfilScreen from './src/screen/EditProfilScreen';

// ── Vendor Screens ────────────────────────────────────────
import VendorDashboardScreen from './src/screen/vendor/VendorDashboardScreen';
import VendorPesananScreen from './src/screen/vendor/VendorPesananScreen';
import VendorMenuScreen from './src/screen/vendor/VendorMenuScreen';
import VendorTokoScreen from './src/screen/vendor/VendorTokoScreen';
import VendorProfilScreen from './src/screen/vendor/VendorProfilScreen';
import VendorAddMenuScreen from './src/screen/vendor/VendorAddMenuScreen';
import VendorEditMenuScreen from './src/screen/vendor/VendorEditMenuScreen';
import VendorDetailPesananScreen from './src/screen/vendor/VendorDetailPesananScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Customer Tab Navigator ────────────────────────────────
function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: Platform.OS === 'web' ? 70 : 60,
          paddingBottom: Platform.OS === 'web' ? 10 : 8,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => {
          const icons = {
            Home: focused ? '🏠' : '🏡',
            Aktivitas: focused ? '⚡' : '🔘',
            Riwayat: focused ? '🕐' : '🕓',
          };
          return (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  position: 'absolute', top: -6,
                  width: 20, height: 3,
                  backgroundColor: '#1565C0', borderRadius: 2,
                }} />
              )}
              <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Beranda' }} />
      <Tab.Screen name="Aktivitas" component={AktivitasScreen} options={{ tabBarLabel: 'Aktivitas' }} />
      <Tab.Screen name="Riwayat" component={RiwayatScreen} options={{ tabBarLabel: 'Riwayat' }} />
    </Tab.Navigator>
  );
}

// ── Vendor Tab Navigator ──────────────────────────────────
function VendorTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => {
          const icons = {
            VendorDashboard: focused ? '📊' : '📈',
            VendorPesanan:   focused ? '🛎️' : '🔔',
            VendorMenu:      focused ? '🍽️' : '🍴',
            VendorToko:      focused ? '🏪' : '🏬',
            VendorProfil:    focused ? '👤' : '👥',
          };
          return (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  position: 'absolute', top: -6,
                  width: 20, height: 3,
                  backgroundColor: '#1565C0', borderRadius: 2,
                }} />
              )}
              <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="VendorDashboard" component={VendorDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="VendorPesanan"   component={VendorPesananScreen}   options={{ tabBarLabel: 'Pesanan' }} />
      <Tab.Screen name="VendorMenu"      component={VendorMenuScreen}      options={{ tabBarLabel: 'Menu' }} />
      <Tab.Screen name="VendorToko"      component={VendorTokoScreen}      options={{ tabBarLabel: 'Toko' }} />
      <Tab.Screen name="VendorProfil"    component={VendorProfilScreen}    options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    registerForPushNotifications();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setRole(data?.role || 'customer');
    setLoading(false);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🍱</Text>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#888' }}>Memuat SmartBite...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          // ── Not logged in ──
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'vendor' ? (
          // ── Vendor ──
          <>
            <Stack.Screen name="VendorMain"          component={VendorTab} />
            <Stack.Screen name="VendorDetailPesanan" component={VendorDetailPesananScreen} />
            <Stack.Screen name="VendorAddMenu"       component={VendorAddMenuScreen} />
            <Stack.Screen name="VendorEditMenu"      component={VendorEditMenuScreen} />
          </>
        ) : (
          // ── Customer ──
          <>
            <Stack.Screen name="Main"        component={MainTab} />
            <Stack.Screen name="Profil"      component={ProfilScreen} />
            <Stack.Screen name="DetailToko"  component={DetailTokoScreen} />
            <Stack.Screen name="Keranjang"   component={KeranjangScreen} />
            <Stack.Screen name="Checkout"    component={CheckoutScreen} />
            <Stack.Screen name="StatusOrder" component={StatusOrderScreen} />
            <Stack.Screen name="Search"      component={SearchScreen} />
            <Stack.Screen name="Ulasan"      component={UlasanScreen} />
            <Stack.Screen name="EditProfil"  component={EditProfilScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}