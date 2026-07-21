/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Handler des messages FCM reçus quand l'app est en arrière-plan / tuée.
// Les payloads "notification" sont affichés par le système ; on gère ici
// les messages data-only pour afficher une vraie notification native.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage?.notification) {
    return; // déjà affiché par le système
  }
  const data = remoteMessage?.data ?? {};
  await notifee.createChannel({
    id: 'whatspay-default',
    name: 'Notifications WhatsPAY',
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    title: data.title ?? 'WhatsPAY',
    body: data.body ?? '',
    data,
    android: { channelId: 'whatspay-default', smallIcon: 'ic_notification', color: '#1BA24B', pressAction: { id: 'default' } },
  });
});

AppRegistry.registerComponent(appName, () => App);
