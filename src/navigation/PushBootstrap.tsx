import {useEffect} from 'react';
import {initPush, teardownPush} from '../services/push';
import {navigate} from './navigationRef';

/**
 * Monté dans la zone authentifiée : initialise le push natif (permission, token
 * FCM → backend, handlers) et route les taps de notification vers l'app.
 */
export default function PushBootstrap() {
  useEffect(() => {
    initPush(data => {
      // Routage basique selon la donnée transportée par la notification.
      if (data?.assignment_id || data?.mission_id) {
        navigate('MissionDetail', {id: String(data.assignment_id ?? data.mission_id)});
      } else {
        navigate('Notifications');
      }
    });
    return () => teardownPush();
  }, []);

  return null;
}
