import { ReactNode } from 'react';

interface OpsPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export default function OpsPageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
}: OpsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-cyan-300/90 mb-2">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
        <p className="text-slate-300 mt-2">{subtitle}</p>
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
    </div>
  );
}
