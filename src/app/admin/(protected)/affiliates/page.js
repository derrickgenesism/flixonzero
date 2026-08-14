import { getAffiliateSettings } from './actions'
import AffiliatesClient from './AffiliatesClient'

export const metadata = {
  title: 'Affiliates Management | Admin',
}

export default async function AdminAffiliatesPage() {
  const data = await getAffiliateSettings()
  return <AffiliatesClient data={data} />
}
