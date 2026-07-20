import {createNavigationContainerRef} from '@react-navigation/native';
import type {AppStackParamList} from './RootNavigator';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

/** Navigation hors composant (ex : tap sur une notification push). */
export function navigate<Name extends keyof AppStackParamList>(
  name: Name,
  params?: AppStackParamList[Name],
) {
  if (navigationRef.isReady()) {
    // @ts-ignore — signature générique acceptée par React Navigation
    navigationRef.navigate(name, params);
  }
}
