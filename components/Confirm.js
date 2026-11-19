'use client';
export default function Confirm({ msg, children, className = 'btn' }) {
  return <button className={className} onClick={(e) => { if (!confirm(msg)) e.preventDefault(); }}>{children}</button>;
}
