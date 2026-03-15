// @ts-nocheck

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
    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
      Showing {count} {count === 1 ? singularLabel : pluralLabel}
    </div>
  );
}
