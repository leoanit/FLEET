import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// Returns page numbers to display, inserting '...' where pages are skipped.
// Example: page 5 of 12 → [1, '...', 4, 5, 6, '...', 12]
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');

  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, totalItems, pageSize, onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: '30px', minWidth: '30px', borderRadius: '6px',
    fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    border: '1px solid var(--border-1)', background: 'var(--surface-2)',
    color: 'var(--text-secondary)', padding: '0 8px',
  };

  return (
    <div className="flex items-center justify-between pt-4 mt-4"
      style={{ borderTop: '1px solid var(--border-0)' }}>

      <span className="text-[11px] font-500" style={{ color: 'var(--text-tertiary)' }}>
        Showing{' '}
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{from}–{to}</span>
        {' '}of{' '}
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{totalItems}</span>
        {' '}entries
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ ...base, ...(currentPage === 1 ? { opacity: 0.35, cursor: 'not-allowed' } : {}) }}
          onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (currentPage !== 1) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <CaretLeft size={12} weight="bold" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`}
              style={{ color: 'var(--text-tertiary)', fontSize: '12px', padding: '0 2px', userSelect: 'none' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={currentPage === p
                ? { ...base, background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--accent-contrast)' }
                : base}
              onMouseEnter={e => { if (currentPage !== p) e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (currentPage !== p) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ ...base, ...(currentPage === totalPages ? { opacity: 0.35, cursor: 'not-allowed' } : {}) }}
          onMouseEnter={e => { if (currentPage !== totalPages) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (currentPage !== totalPages) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <CaretRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
};
