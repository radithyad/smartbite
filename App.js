import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { useState, useEffect } from 'react'
import { supabase } from './src/service/supabase';
import { registerForPushNotifications } from './src/service/notification';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTab() {
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home: focused ? '🏠' : '🏡',
            Aktivitas: focused ? '⚡' : '🔘',
            Riwayat: focused ? '🕐' : '🕓',
          };
          return (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  width: 20,
                  height: 3,
                  backgroundColor: '#1565C0',
                  borderRadius: 2,
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

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    registerForPushNotifications();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Tampilkan splash screen dulu
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Setelah splash, tampilkan loading cek session
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
      <Stack.Navigator>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTab} options={{ headerShown: false }} />
            <Stack.Screen name="Profil" component={ProfilScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DetailToko" component={DetailTokoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Keranjang" component={KeranjangScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StatusOrder" component={StatusOrderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Ulasan" component={UlasanScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfil" component={EditProfilScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}