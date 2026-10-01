import {useEffect} from 'react';
import {initPush, teardownPush} from '../services/push';
import {navigate} from './navigationRef';

/**
 * Monté dans la zone authentifiée : initialise le push natif (permission, token
 * FCM → backend, handlers) et route les taps de notification vers l'app.
 *
 * `onNotificationTap` est optionnel pour permettre un routage différent selon l'espace
 * (diffuseur vs Partenaire Média, piles de navigation distinctes) — défaut = comportement
 * diffuseur historique.
 */
export default function PushBootstrap({onNotificationTap}: {onNotificationTap?: (data: any) => void}) {
  useEffect(() => {
    initPush(
      onNotificationTap ??
        (data => {
          // Routage basique selon la donnée transportée par la notification.
          if (data?.assignment_id || data?.mission_id) {
            navigate('MissionDetail', {id: String(data.assignment_id ?? data.mission_id)});
          } else {
            navigate('Notifications');
          }
        }),
    );
    return () => teardownPush();
  }, [onNotificationTap]);

  return null;
}
