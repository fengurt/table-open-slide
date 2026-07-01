import { createTableContentClient, forBriefExecutiveSummary } from '@table/content';

const apiBase =
  process.env.NEXT_PUBLIC_CMS_API_URL ?? process.env.CMS_API_URL ?? 'http://localhost:3001/api';

export default async function Page() {
  const client = createTableContentClient({ apiBaseUrl: apiBase });
  const summary = await forBriefExecutiveSummary(client, 'en');
  return (
    <main>
      <h1>Brief</h1>
      <p>{summary}</p>
    </main>
  );
}
