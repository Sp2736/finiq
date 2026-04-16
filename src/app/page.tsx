import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect users visiting the root directly to the authentication flow
  redirect('/login');
}
