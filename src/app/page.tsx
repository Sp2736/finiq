// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // If you are using subdomain routing (investor.domain.com):
  // You might want to redirect to the explicit subdomain in production, 
  // but for local testing or relative routing:
  redirect('/login'); 
}