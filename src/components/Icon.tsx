import React from 'react';
import type {TextStyle, StyleProp} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** Icône vectorielle (Ionicons — style outline moderne). */
export default function Icon({
  name,
  size = 22,
  color = '#000',
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
