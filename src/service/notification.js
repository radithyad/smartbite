import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export function setupOrderNotification(orderId, tokoNama) {
  // Simulasi notifikasi status order (nanti bisa pakai Supabase Realtime)
  setTimeout(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👨‍🍳 Pesanan Diproses!',
        body: `${tokoNama} sedang menyiapkan pesananmu`,
        data: { orderId },
      },
      trigger: null,
    });
  }, 5000);

  setTimeout(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Pesanan Siap Diambil!',
        body: `Pesananmu di ${tokoNama} sudah siap! Segera pickup ya!`,
        data: { orderId },
      },
      trigger: null,
    });
  }, 12000);
}