import {colors} from '../theme';

/** Libellé + couleur lisibles pour un statut d'assignation. */
export function statusMeta(status: string): {label: string; color: string; bg: string} {
  switch (status) {
    case 'ASSIGNED':
      return {label: 'À accepter', color: '#2563eb', bg: '#dbeafe'};
    case 'PENDING':
      return {label: 'En cours', color: colors.primaryDark, bg: colors.primarySoft};
    case 'SUBMITED':
      return {label: 'En vérification', color: colors.warning, bg: colors.warningSoft};
    case 'SUBMISSION_ACCEPTED':
      return {label: 'Validée', color: colors.primaryDark, bg: colors.primarySoft};
    case 'SUBMISSION_REJECTED':
      return {label: 'Rejetée', color: colors.danger, bg: colors.dangerSoft};
    case 'PAID':
      return {label: 'Payée', color: colors.primaryDark, bg: colors.primarySoft};
    case 'EXPIRED':
      return {label: 'Expirée', color: colors.textMuted, bg: '#f3f4f6'};
    default:
      return {label: status, color: colors.textMuted, bg: '#f3f4f6'};
  }
}

export function money(n: number | undefined | null): string {
  // Montants toujours en entiers (pas de décimales) — FCFA.
  return `${Math.round(Number(n ?? 0)).toLocaleString('fr-FR')} FCFA`;
}
