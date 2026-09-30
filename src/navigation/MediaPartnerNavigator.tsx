import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MediaPartnerMissionsScreen from '../screens/MediaPartnerMissionsScreen';
import MediaPartnerMissionDetailScreen from '../screens/MediaPartnerMissionDetailScreen';
import MediaPartnerRecaptureScreen from '../screens/MediaPartnerRecaptureScreen';
import {colors} from '../theme';

/**
 * Espace authentifié dédié au Partenaire Média (chaîne WhatsApp).
 *
 * Compte sans lien avec un compte diffuseur (login séparé), donc pile de navigation
 * totalement distincte de AppNavigator (pas d'onglets diffuseur, pas de drawer/AppHeader
 * qui appellent des endpoints diffuseur comme /notifications ou /profile).
 */
export type MediaPartnerStackParamList = {
  MediaPartnerMissions: undefined;
  MediaPartnerMissionDetail: {id: string};
  MediaPartnerRecapture: undefined;
};

const Stack = createNativeStackNavigator<MediaPartnerStackParamList>();

export default function MediaPartnerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MediaPartnerMissions"
      screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.bg}}}>
      <Stack.Screen name="MediaPartnerMissions" component={MediaPartnerMissionsScreen} />
      <Stack.Screen name="MediaPartnerMissionDetail" component={MediaPartnerMissionDetailScreen} />
      <Stack.Screen name="MediaPartnerRecapture" component={MediaPartnerRecaptureScreen} />
    </Stack.Navigator>
  );
}
