export function formatConfidenceBadge(jobProbability: number): {
  label: string;
  colorClass: string;
  badgeBg: string;
} {
  if (jobProbability >= 80) {
    return {
      label: 'Strong Potential',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    };
  } else if (jobProbability >= 60) {
    return {
      label: 'Good Potential',
      colorClass: 'text-blue-700 dark:text-blue-400',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-800',
    };
  } else if (jobProbability >= 40) {
    return {
      label: 'Moderate',
      colorClass: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    };
  } else {
    return {
      label: 'Needs Improvement',
      colorClass: 'text-rose-700 dark:text-rose-400',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    };
  }
}
