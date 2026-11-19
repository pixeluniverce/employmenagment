import { NextResponse } from 'next/server';
async function token() {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(process.env.SESSION_SECRET + ':' + process.env.ADMIN_PASSWORD));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function middleware(req) {
  if (req.nextUrl.pathname.startsWith('/login')) return NextResponse.next();
  if (req.cookies.get('sess')?.value !== (await token())) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
