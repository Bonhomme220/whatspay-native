import React from 'react';
import {NavigationContainer, type NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {TabParamList} from './MainTabs';
import {useAuth} from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MissionDetailScreen from '../screens/MissionDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import AmbassadorScreen from '../screens/AmbassadorScreen';
import TicketsScreen from '../screens/TicketsScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import NewTicketScreen from '../screens/NewTicketScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ComplaintsScreen from '../screens/ComplaintsScreen';
import NewComplaintScreen from '../screens/NewComplaintScreen';
import FaqScreen from '../screens/FaqScreen';
import MainTabs from './MainTabs';
import PushBootstrap from './PushBootstrap';
import {navigationRef} from './navigationRef';
import {colors} from '../theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  MissionDetail: {id: string};
  Notifications: undefined;
  Withdraw: {balance: number};
  Ambassador: undefined;
  Tickets: undefined;
  TicketDetail: {id: string};
  NewTicket: undefined;
  Settings: undefined;
  Complaints: undefined;
  NewComplaint: {missionId: string};
  Faq: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.bg}}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <>
      <PushBootstrap />
      <AppStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.bg}}}>
        <AppStack.Screen name="Tabs" component={MainTabs} />
        <AppStack.Screen name="MissionDetail" component={MissionDetailScreen} />
        <AppStack.Screen name="Notifications" component={NotificationsScreen} />
        <AppStack.Screen name="Withdraw" component={WithdrawScreen} />
        <AppStack.Screen name="Ambassador" component={AmbassadorScreen} />
        <AppStack.Screen name="Tickets" component={TicketsScreen} />
        <AppStack.Screen name="TicketDetail" component={TicketDetailScreen} />
        <AppStack.Screen name="NewTicket" component={NewTicketScreen} />
        <AppStack.Screen name="Settings" component={SettingsScreen} />
        <AppStack.Screen name="Complaints" component={ComplaintsScreen} />
        <AppStack.Screen name="NewComplaint" component={NewComplaintScreen} />
        <AppStack.Screen name="Faq" component={FaqScreen} />
      </AppStack.Navigator>
    </>
  );
}

export default function RootNavigator() {
  const {ready, token} = useAuth();

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {token ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
