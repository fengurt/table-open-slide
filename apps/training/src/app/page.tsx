import { createTableContentClient, forTrainingModuleTitle } from '@table/content';

const apiBase =
  process.env.NEXT_PUBLIC_CMS_API_URL ?? process.env.CMS_API_URL ?? 'http://localhost:3001/api';

export default async function Page() {
  const client = createTableContentClient({ apiBaseUrl: apiBase });
  const title = await forTrainingModuleTitle(client, 'en');
  return (
    <main>
      <h1>{title}</h1>
      <p>Training module shell — content from Payload.</p>
    </main>
  );
}
