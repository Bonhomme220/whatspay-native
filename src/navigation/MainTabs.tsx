import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import MissionsScreen from '../screens/MissionsScreen';
import GainsScreen from '../screens/GainsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {colors, font} from '../theme';

export type TabParamList = {
  Accueil: undefined;
  Missions: undefined;
  Gains: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Accueil: '🏠',
  Missions: '🎯',
  Gains: '💰',
  Profil: '👤',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {fontSize: font.size.xs, fontWeight: font.weight.medium},
        tabBarIcon: ({focused}) => (
          <Text style={{fontSize: 20, opacity: focused ? 1 : 0.6}}>{ICONS[route.name]}</Text>
        ),
      })}>
      <Tab.Screen name="Accueil" component={DashboardScreen} />
      <Tab.Screen name="Missions" component={MissionsScreen} />
      <Tab.Screen name="Gains" component={GainsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
