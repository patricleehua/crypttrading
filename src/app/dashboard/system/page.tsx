import { redirect } from 'next/navigation';

export default function SystemPage() {
  redirect('/dashboard/system/users');
}