import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

/**
 * Télécharge réellement un média (image/vidéo) dans la galerie du téléphone, au lieu de
 * se contenter d'ouvrir l'URL dans le navigateur (ce que faisait Linking.openURL seul — sur
 * iPhone ça n'enregistre rien, ça affiche juste le contenu dans Safari/WebView).
 *
 * CameraRoll.save() accepte directement une URL distante (http/https) et la télécharge en
 * interne avant de l'enregistrer dans la pellicule — pas besoin de gérer le fichier local
 * nous-mêmes. Pour un type de média non supporté (pdf, etc.), on retombe sur l'ouverture
 * classique dans le navigateur.
 */
export async function downloadMediaToDevice(url: string, mediaType?: string | null): Promise<void> {
  const type = (mediaType || '').toLowerCase();
  const isVideo = type.includes('video');
  const isImage = type.includes('image') || (!isVideo && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url));

  if (!isImage && !isVideo) {
    // Type non supporté par la pellicule (pdf, texte…) — seul fallback possible.
    await Linking.openURL(url);
    return;
  }

  if (Platform.OS === 'android' && Number(Platform.Version) < 29) {
    // Scoped storage (API 29+) ne nécessite pas cette permission ; en dessous, si.
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Permission refusée', "L'accès au stockage est nécessaire pour télécharger le média.");
      return;
    }
  }

  try {
    await CameraRoll.save(url, {type: isVideo ? 'video' : 'photo', album: 'WhatsPAY'});
    Alert.alert('Téléchargé ✓', isVideo ? 'La vidéo a été enregistrée dans votre galerie.' : "L'image a été enregistrée dans votre galerie.");
  } catch (e) {
    // Échec (permission refusée au runtime iOS, média introuvable…) — fallback navigateur
    // pour que l'utilisateur puisse au moins voir/sauvegarder manuellement le contenu.
    Alert.alert(
      'Téléchargement impossible',
      "Le média n'a pas pu être enregistré dans la galerie. Ouverture dans le navigateur…",
    );
    await Linking.openURL(url).catch(() => {});
  }
}
