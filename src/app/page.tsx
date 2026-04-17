import { redirect } from 'next/navigation';

export default function RootPage() {
  // With the new architecture, the root domain serves exclusively 
  // as an entry point for the public-facing Investor portal.
  // Admins and Distributors must use their undisclosed URLs directly.
  redirect('/login'); 
}