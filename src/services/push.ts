import {PermissionsAndroid, Platform} from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {registerFcmToken} from '../api/auth';

const CHANNEL_ID = 'whatspay-default';

/** Demande la permission de notifications (Android 13+ runtime + iOS). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (res !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/** Crée le canal Android par défaut (obligatoire depuis Android 8). */
async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Notifications WhatsPAY',
    importance: AndroidImportance.HIGH,
  });
}

/** Affiche une vraie notification système (utilisé en foreground / data-only). */
export async function displayNotification(
  title?: string,
  body?: string,
  data?: {[key: string]: any},
): Promise<void> {
  await ensureChannel();
  await notifee.displayNotification({
    title: title ?? 'WhatsPAY',
    body: body ?? '',
    data: data ?? {},
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: {id: 'default'},
    },
  });
}

let unsubscribers: Array<() => void> = [];

/**
 * Initialise le push après connexion :
 *  - permission + canal
 *  - récupération/enregistrement du token FCM (POST /fcm-token)
 *  - handlers foreground (affichage), refresh de token, taps (navigation).
 */
export async function initPush(
  onOpen?: (data?: {[key: string]: any}) => void,
): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }
  await ensureChannel();

  try {
    const token = await messaging().getToken();
    if (token) {
      await registerFcmToken(token);
    }
  } catch {
    // silencieux
  }

  unsubscribers.push(
    messaging().onTokenRefresh(async token => {
      try {
        await registerFcmToken(token);
      } catch {}
    }),
  );

  // Message reçu au premier plan → afficher une notification système
  unsubscribers.push(
    messaging().onMessage(async (msg: FirebaseMessagingTypes.RemoteMessage) => {
      await displayNotification(msg.notification?.title, msg.notification?.body, msg.data);
    }),
  );

  // Tap sur une notification affichée par notifee (au premier plan)
  unsubscribers.push(
    notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        onOpen?.(detail.notification?.data);
      }
    }),
  );

  // Ouverture de l'app depuis une notification (app en arrière-plan)
  unsubscribers.push(
    messaging().onNotificationOpenedApp(msg => {
      onOpen?.(msg?.data);
    }),
  );

  // Ouverture depuis un état "tué" (cold start)
  const initial = await messaging().getInitialNotification();
  if (initial) {
    onOpen?.(initial.data);
  }
}

export function teardownPush(): void {
  unsubscribers.forEach(u => {
    try {
      u();
    } catch {}
  });
  unsubscribers = [];
}
