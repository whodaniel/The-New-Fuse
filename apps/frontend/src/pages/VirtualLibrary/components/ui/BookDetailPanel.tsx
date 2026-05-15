// @ts-nocheck
import { useLibraryStore } from '../../store';

export default function BookDetailPanel() {
  const selectedBook = useLibraryStore((s) => s.selectedBook);
  const selectBook = useLibraryStore((s) => s.selectBook);
  const addAnnotation = useLibraryStore((s) => s.addAnnotation);

  if (!selectedBook) return null;

  return (
    <div
      className="animate-slideUp"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        width: '580px',
        maxHeight: '80vh',
        overflowY: 'auto',
        background: 'rgba(26,20,16,0.95)',
        border: '1px solid rgba(240,217,181,0.3)',
        borderRadius: '12px',
        padding: '32px',
        fontFamily: "'Courier New', monospace",
        color: '#f0d9b5',
        boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 20px rgba(240,217,181,0.05)',
      }}
    >
      <button
        onClick={() => selectBook(null)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          background: 'none',
          border: '1px solid rgba(240,217,181,0.3)',
          borderRadius: '4px',
          color: '#a89279',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '4px 10px',
          fontFamily: "'Courier New', monospace",
        }}
      >
        ✕ Close
      </button>

      {selectedBook.coverUrl && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img
            src={selectedBook.coverUrl}
            alt={selectedBook.title}
            style={{
              maxHeight: '200px',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      )}

      <h2
        style={{
          fontSize: '1.5em',
          marginBottom: '4px',
          color: '#f0d9b5',
          lineHeight: 1.3,
        }}
      >
        {selectedBook.title}
      </h2>

      <p style={{ color: '#a89279', fontSize: '0.9em', marginBottom: '16px' }}>
        {selectedBook.author}
        {selectedBook.publishYear && ` · ${selectedBook.publishYear}`}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          border: '1px solid rgba(240,217,181,0.1)',
        }}
      >
        {selectedBook.ddc && (
          <div>
            <span style={{ color: '#6b5a48', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              DDC
            </span>
            <div style={{ color: '#f0d9b5', fontSize: '14px' }}>{selectedBook.ddc}</div>
          </div>
        )}
        {selectedBook.lcc && (
          <div>
            <span style={{ color: '#6b5a48', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              LCC
            </span>
            <div style={{ color: '#f0d9b5', fontSize: '14px' }}>{selectedBook.lcc}</div>
          </div>
        )}
        {selectedBook.isbn && (
          <div>
            <span style={{ color: '#6b5a48', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ISBN
            </span>
            <div style={{ color: '#f0d9b5', fontSize: '14px' }}>{selectedBook.isbn}</div>
          </div>
        )}
        {selectedBook.pageCount && (
          <div>
            <span style={{ color: '#6b5a48', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Pages
            </span>
            <div style={{ color: '#f0d9b5', fontSize: '14px' }}>{selectedBook.pageCount}</div>
          </div>
        )}
      </div>

      {selectedBook.description && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#6b5a48', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Description
          </div>
          <p
            style={{
              color: '#a89279',
              fontSize: '0.85em',
              lineHeight: 1.7,
            }}
          >
            {selectedBook.description}
          </p>
        </div>
      )}

      {selectedBook.subjects && selectedBook.subjects.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#6b5a48', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Subjects
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selectedBook.subjects.map((subject, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(240,217,181,0.1)',
                  border: '1px solid rgba(240,217,181,0.15)',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '0.75em',
                  color: '#a89279',
                }}
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid rgba(240,217,181,0.15)',
          paddingTop: '16px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={() => addAnnotation(selectedBook.id, 'sticky-note')}
          style={{
            background: 'rgba(240,217,181,0.1)',
            border: '1px solid rgba(240,217,181,0.25)',
            borderRadius: '6px',
            color: '#d4b896',
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
          }}
        >
          📌 Add Note
        </button>
        <button
          onClick={() => addAnnotation(selectedBook.id, 'highlight')}
          style={{
            background: 'rgba(240,217,181,0.1)',
            border: '1px solid rgba(240,217,181,0.25)',
            borderRadius: '6px',
            color: '#d4b896',
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
          }}
        >
          🖍 Highlight
        </button>
        <button
          onClick={() => addAnnotation(selectedBook.id, 'bookmark')}
          style={{
            background: 'rgba(240,217,181,0.1)',
            border: '1px solid rgba(240,217,181,0.25)',
            borderRadius: '6px',
            color: '#d4b896',
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
          }}
        >
          🔖 Bookmark
        </button>
      </div>
    </div>
  );
}
