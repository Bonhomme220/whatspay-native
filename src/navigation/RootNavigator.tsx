import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MissionDetailScreen from '../screens/MissionDetailScreen';
import MainTabs from './MainTabs';
import {colors} from '../theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  MissionDetail: {id: string};
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
    <AppStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.bg}}}>
      <AppStack.Screen name="Tabs" component={MainTabs} />
      <AppStack.Screen name="MissionDetail" component={MissionDetailScreen} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const {ready, token} = useAuth();

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {token ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
