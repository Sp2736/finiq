import { redirect } from 'next/navigation';
import InvestorDashboard from './investor/page';

export default function Home() {
  // Redirect users visiting the root directly to the authentication flow
  redirect('/login');
  return (
    <InvestorDashboard />
  );
}
