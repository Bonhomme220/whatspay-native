import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MediaPartnerDashboardScreen from '../screens/MediaPartnerDashboardScreen';
import MediaPartnerMissionsScreen from '../screens/MediaPartnerMissionsScreen';
import MediaPartnerWalletScreen from '../screens/MediaPartnerWalletScreen';
import MediaPartnerProfileScreen from '../screens/MediaPartnerProfileScreen';
import Icon from '../components/Icon';
import {colors, font} from '../theme';

/**
 * Onglets du bas pour le Partenaire Média — miroir de MainTabs.tsx (diffuseur) :
 * 4 destinations primaires. Recapture/Tickets/FAQ restent accessibles depuis
 * l'onglet Profil ou l'écran Missions (voir MediaPartnerNavigator).
 */
export type MediaPartnerTabParamList = {
  Accueil: undefined;
  Missions: undefined;
  Gains: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<MediaPartnerTabParamList>();

const ICONS: Record<keyof MediaPartnerTabParamList, string> = {
  Accueil: 'home',
  Missions: 'megaphone',
  Gains: 'wallet',
  Profil: 'person',
};

export default function MediaPartnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f3f4f6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {fontSize: 10, fontWeight: font.weight.medium},
        tabBarIcon: ({focused, color}) => (
          <Icon name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={22} color={color} />
        ),
      })}>
      <Tab.Screen name="Accueil" component={MediaPartnerDashboardScreen} />
      <Tab.Screen name="Missions" component={MediaPartnerMissionsScreen} />
      <Tab.Screen name="Gains" component={MediaPartnerWalletScreen} />
      <Tab.Screen name="Profil" component={MediaPartnerProfileScreen} />
    </Tab.Navigator>
  );
}
