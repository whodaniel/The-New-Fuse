export interface ResultsCountProps {
  count: number;
  singularLabel?: string;
  pluralLabel?: string;
}

export function ResultsCount({
  count,
  singularLabel = 'result',
  pluralLabel = 'results',
}: ResultsCountProps) {
  return (
    <div className="text-sm text-gray-600 dark:text-gray-400">
      Showing {count} {count === 1 ? singularLabel : pluralLabel}
    </div>
  );
}
