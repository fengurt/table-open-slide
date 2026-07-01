import { createTableContentClient, forFinancialsHeadline } from '@table/content';

const apiBase =
  process.env.NEXT_PUBLIC_CMS_API_URL ?? process.env.CMS_API_URL ?? 'http://localhost:3001/api';

export default async function Page() {
  const client = createTableContentClient({ apiBaseUrl: apiBase });
  const headline = await forFinancialsHeadline(client, 'en');
  return (
    <main>
      <h1>{headline}</h1>
      <p>Metrics surface — same CMS keys as slides and website.</p>
    </main>
  );
}
