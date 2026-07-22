import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import MissionsScreen from '../screens/MissionsScreen';
import GainsScreen from '../screens/GainsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Icon from '../components/Icon';
import {colors, font} from '../theme';

export type TabParamList = {
  Accueil: undefined;
  Campagnes: undefined;
  Gains: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Accueil: 'home',
  Campagnes: 'megaphone',
  Gains: 'wallet',
  Profil: 'person',
};

export default function MainTabs() {
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
      <Tab.Screen name="Accueil" component={DashboardScreen} />
      <Tab.Screen name="Campagnes" component={MissionsScreen} />
      <Tab.Screen name="Gains" component={GainsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
