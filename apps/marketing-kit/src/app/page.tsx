import { createTableContentClient, forMarketingKitTitle } from '@table/content';

const apiBase =
  process.env.NEXT_PUBLIC_CMS_API_URL ?? process.env.CMS_API_URL ?? 'http://localhost:3001/api';

export default async function Page() {
  const client = createTableContentClient({ apiBaseUrl: apiBase });
  const title = await forMarketingKitTitle(client, 'en');
  return (
    <main>
      <h1>{title}</h1>
      <p>Marketing kit — shared brand strings from CMS.</p>
    </main>
  );
}
