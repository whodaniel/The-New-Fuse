import React from 'react';

/**
 * Official TNF logo for the Tauri desktop shell.
 *
 * Matches apps/frontend/src/components/brand/TnfLogo.tsx: local assets only.
 * Remote thenewfuse.com URLs break under Tauri CSP (`img-src 'self'`).
 */
export const TNF_LOGO_SRC = '/assets/brand/tnf-logo-192.jpg';
export const TNF_LOGO_MASTER_SRC = '/assets/brand/tnf-logo.png';
export const TNF_WORDMARK = 'The New Fuse';
export const TNF_SHORT_MARK = 'TNF';

export interface TnfLogoProps {
  size?: number;
  showWordmark?: boolean;
  /** Compact sidebar: "TNF" primary with optional full name underneath handled by parent. */
  compactWordmark?: boolean;
  onClick?: () => void;
  className?: string;
  wordmarkClassName?: string;
  title?: string;
}

export const TnfLogo: React.FC<TnfLogoProps> = ({
  size = 36,
  showWordmark = false,
  compactWordmark = false,
  onClick,
  className = '',
  wordmarkClassName = '',
  title = TNF_WORDMARK,
}) => {
  const mark = (
    <>
      <img
        src={TNF_LOGO_SRC}
        alt={showWordmark || compactWordmark ? '' : TNF_WORDMARK}
        aria-hidden={showWordmark || compactWordmark || undefined}
        width={size}
        height={size}
        className="tnf-logo-mark"
        style={{ width: size, height: size }}
        decoding="async"
      />
      {compactWordmark ? (
        <span className={`tnf-logo-short ${wordmarkClassName}`.trim()}>{TNF_SHORT_MARK}</span>
      ) : null}
      {showWordmark ? (
        <span className={`tnf-logo-wordmark ${wordmarkClassName}`.trim()}>{TNF_WORDMARK}</span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`tnf-logo tnf-logo-btn ${className}`.trim()}
        onClick={onClick}
        title={title}
        aria-label={title}
      >
        {mark}
      </button>
    );
  }

  return <span className={`tnf-logo ${className}`.trim()}>{mark}</span>;
};

export default TnfLogo;
