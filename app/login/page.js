import { login } from '@/app/actions';
export default function Login({ searchParams }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-navy">Production Pro</h1>
        <div><label className="lbl">Admin password</label><input name="password" type="password" className="inp" autoFocus required /></div>
        {searchParams.e && <p className="text-sm text-red-600">Wrong password. Try again.</p>}
        <button className="btn w-full">Sign in</button>
      </form>
    </div>
  );
}
