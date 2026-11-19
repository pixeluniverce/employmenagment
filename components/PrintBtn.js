'use client';
export default function PrintBtn({ label = 'Print' }) { return <button className="btn-o no-print" onClick={() => window.print()}>{label}</button>; }
