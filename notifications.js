import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Android push does not work inside Expo Go (SDK 53+), and loading the
// notifications package there can crash the app. So we only load it when push
// can really work: iPhone, or an Android development build.
export const pushSupported = !(Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient');
const Notifications = pushSupported ? require('expo-notifications') : null;

if (Notifications) {
  // Show alerts with sound even if the app is open on screen
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Asks permission and returns this phone's push token (or null)
export async function registerForPush() {
  if (!Notifications || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      sound: 'default',
      bypassDnd: true,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.warn('No EAS projectId. Run: npx eas-cli@latest init');
    return null;
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

// Calls cb when someone taps a notification. Returns something with .remove()
export function onNotificationTap(cb) {
  if (!Notifications) return { remove() {} };
  return Notifications.addNotificationResponseReceivedListener(cb);
}

// True if the app was opened by tapping a notification
export async function hadNotificationTap() {
  if (!Notifications) return false;
  try { return !!(await Notifications.getLastNotificationResponseAsync()); } catch { return false; }
}