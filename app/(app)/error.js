'use client';
export default function Err({ reset }) {
  return (
    <div className="card max-w-xl">
      <h1 className="mb-2 text-lg font-semibold text-red-700">This page could not load</h1>
      <p className="text-sm text-slate-700">Most often the database tables are missing or the environment variables are wrong. Open <a className="text-brand underline" href="/status">/status</a> to see exactly what is failing.</p>
      <button className="btn mt-4" onClick={() => reset()}>Try again</button>
    </div>
  );
}
