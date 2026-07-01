import { createTableContentClient, forWebsiteHero } from '@table/content';

const apiBase =
  process.env.NEXT_PUBLIC_CMS_API_URL ?? process.env.CMS_API_URL ?? 'http://localhost:3001/api';

export default async function Page() {
  const client = createTableContentClient({ apiBaseUrl: apiBase });
  const hero = await forWebsiteHero(client, 'en');
  return (
    <main>
      <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 12 }}>
        {hero.eyebrow}
      </p>
      <h1 style={{ fontSize: 36 }}>{hero.title}</h1>
      <p style={{ maxWidth: 520 }}>{hero.subtitle}</p>
    </main>
  );
}
