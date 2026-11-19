'use client';
export default function Del({ msg = 'Delete this record? This cannot be undone.', children = 'Delete' }) {
  return <button className="text-sm text-red-600 hover:underline" onClick={(e) => { if (!confirm(msg)) e.preventDefault(); }}>{children}</button>;
}
