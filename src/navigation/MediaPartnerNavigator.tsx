import React from 'react';
import type {NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MediaPartnerTabs, {MediaPartnerTabParamList} from './MediaPartnerTabs';
import MediaPartnerMissionDetailScreen from '../screens/MediaPartnerMissionDetailScreen';
import MediaPartnerRecaptureScreen from '../screens/MediaPartnerRecaptureScreen';
import MediaPartnerTicketsScreen from '../screens/MediaPartnerTicketsScreen';
import MediaPartnerTicketDetailScreen from '../screens/MediaPartnerTicketDetailScreen';
import MediaPartnerFaqScreen from '../screens/MediaPartnerFaqScreen';
import {colors} from '../theme';

/**
 * Espace authentifié dédié au Partenaire Média (chaîne WhatsApp).
 *
 * Compte sans lien avec un compte diffuseur (login séparé), donc pile de navigation
 * totalement distincte de AppNavigator (pas d'onglets diffuseur, pas de drawer/AppHeader
 * qui appellent des endpoints diffuseur comme /notifications ou /profile).
 *
 * Structure : un onglet du bas (MediaPartnerTabs — Accueil/Missions/Gains/Profil) en route
 * initiale, plus les écrans secondaires empilés par-dessus (détail mission, recapture,
 * tickets, FAQ), atteignables depuis l'accueil, les missions ou le profil.
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
    <Stack.Navigator
      initialRouteName="MediaPartnerTabs"
      screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.bg}}}>
      <Stack.Screen name="MediaPartnerTabs" component={MediaPartnerTabs} />
      <Stack.Screen name="MediaPartnerMissionDetail" component={MediaPartnerMissionDetailScreen} />
      <Stack.Screen name="MediaPartnerRecapture" component={MediaPartnerRecaptureScreen} />
      <Stack.Screen name="MediaPartnerTickets" component={MediaPartnerTicketsScreen} />
      <Stack.Screen name="MediaPartnerTicketDetail" component={MediaPartnerTicketDetailScreen} />
      <Stack.Screen name="MediaPartnerFaq" component={MediaPartnerFaqScreen} />
    </Stack.Navigator>
  );
}
