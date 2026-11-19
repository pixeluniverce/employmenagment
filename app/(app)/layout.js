import Nav from '@/components/Nav';
export default function AppLayout({ children }) {
  return (<><Nav /><main className="p-4 md:ml-60 md:p-8">{children}</main></>);
}
