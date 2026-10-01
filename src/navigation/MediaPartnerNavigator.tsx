import React from 'react';
import type {NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MediaPartnerTabs, {MediaPartnerTabParamList} from './MediaPartnerTabs';
import MediaPartnerMissionDetailScreen from '../screens/MediaPartnerMissionDetailScreen';
import MediaPartnerRecaptureScreen from '../screens/MediaPartnerRecaptureScreen';
import MediaPartnerTicketsScreen from '../screens/MediaPartnerTicketsScreen';
import MediaPartnerTicketDetailScreen from '../screens/MediaPartnerTicketDetailScreen';
import MediaPartnerFaqScreen from '../screens/MediaPartnerFaqScreen';
import PushBootstrap from './PushBootstrap';
import MediaPartnerHeader from '../components/MediaPartnerHeader';
import MediaPartnerDrawer from '../components/MediaPartnerDrawer';
import {DrawerProvider} from '../context/DrawerContext';
import {navigationRef} from './navigationRef';
import {colors} from '../theme';

/**
 * Espace authentifié dédié au Partenaire Média (chaîne WhatsApp).
 *
 * Compte sans lien avec un compte diffuseur (login séparé), donc pile de navigation
 * totalement distincte de AppNavigator (pas d'onglets ni d'endpoints diffuseur) — mais même
 * chrome de navigation (header + drawer + push) via des variantes dédiées
 * (MediaPartnerHeader/MediaPartnerDrawer) plutôt que les composants diffuseur AppHeader/
 * AppDrawer, qui pointent vers des routes et endpoints qui n'existent pas ici.
 *
 * Structure : un onglet du bas (MediaPartnerTabs — Accueil/Missions/Gains/Profil) en route
 * initiale, plus les écrans secondaires empilés par-dessus (détail mission, recapture,
 * tickets, FAQ), atteignables depuis l'accueil, les missions, le profil ou le drawer.
 */
export type MediaPartnerStackParamList = {
  MediaPartnerTabs: NavigatorScreenParams<MediaPartnerTabParamList> | undefined;
  MediaPartnerMissionDetail: {id: string};
  MediaPartnerRecapture: undefined;
  MediaPartnerTickets: undefined;
  MediaPartnerTicketDetail: {id: string};
  MediaPartnerFaq: undefined;
};

const Stack = createNativeStackNavigator<MediaPartnerStackParamList>();

export default function MediaPartnerNavigator() {
  return (
    <DrawerProvider>
      <PushBootstrap
        onNotificationTap={data => {
          if (navigationRef.isReady()) {
            if (data?.assignment_id || data?.mission_id) {
              // @ts-ignore — navigationRef est typé sur la pile diffuseur, route valide à l'exécution.
              navigationRef.navigate('MediaPartnerMissionDetail', {id: String(data.assignment_id ?? data.mission_id)});
            } else {
              // @ts-ignore — idem.
              navigationRef.navigate('MediaPartnerTabs', {screen: 'Accueil'});
            }
          }
        }}
      />
      <Stack.Navigator
        initialRouteName="MediaPartnerTabs"
        screenOptions={{header: () => <MediaPartnerHeader />, contentStyle: {backgroundColor: colors.bg}}}>
        <Stack.Screen name="MediaPartnerTabs" component={MediaPartnerTabs} />
        <Stack.Screen name="MediaPartnerMissionDetail" component={MediaPartnerMissionDetailScreen} />
        <Stack.Screen name="MediaPartnerRecapture" component={MediaPartnerRecaptureScreen} />
        <Stack.Screen name="MediaPartnerTickets" component={MediaPartnerTicketsScreen} />
        <Stack.Screen name="MediaPartnerTicketDetail" component={MediaPartnerTicketDetailScreen} />
        <Stack.Screen name="MediaPartnerFaq" component={MediaPartnerFaqScreen} />
      </Stack.Navigator>
      <MediaPartnerDrawer />
    </DrawerProvider>
  );
}
