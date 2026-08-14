import { getSupportData } from './actions';
import SupportAdminClient from './SupportAdminClient';

export const metadata = {
  title: 'Support Tickets | Admin',
}

export default async function AdminSupportPage() {
  const data = await getSupportData();
  return <SupportAdminClient data={data} />;
}
