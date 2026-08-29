import { Progress } from '@/lib/types';

export function ProgressBar({ completed, total, percentage }: Progress) {
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded bg-gray-200"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-black" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-600">
        {completed} of {total} {total === 1 ? 'lesson' : 'lessons'} · {percentage}%
      </p>
    </div>
  );
}
