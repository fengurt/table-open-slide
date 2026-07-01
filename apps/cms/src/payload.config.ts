import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { ContentBlocks } from './collections/ContentBlocks';
import { Media } from './collections/Media';
import { SlideBindings } from './collections/SlideBindings';
import { SlideComments } from './collections/SlideComments';
import { Users } from './collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const connectionString =
  process.env.DATABASE_URL ??
  process.env.DATABASE_URI ??
  'postgres://tablecontent:tablecontent@127.0.0.1:5432/tablecontent';

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
            email: 'dev@example.com',
            password: 'dev',
            prefillOnly: false,
          }
        : false,
  },
  localization: {
    locales: ['en', 'zh-CN', 'zh-TW', 'ja'],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [Users, Media, ContentBlocks, SlideComments, SlideBindings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString,
    },
  }),
  sharp,
  plugins: [],
  onInit: async (payload) => {
    const { totalDocs: userTotal } = await payload.count({ collection: 'users', where: {} });
    if (userTotal === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@example.com',
          password: 'dev',
          role: 'superadmin',
        },
        overrideAccess: true,
      });
    }

    const { totalDocs: contentBlockTotal } = await payload.count({
      collection: 'content-blocks',
      where: {},
    });
    if (contentBlockTotal > 0) return;
    const seeds: Array<{ key: string; body: Record<string, string> }> = [
      {
        key: 'open-slide-launch.cover.contentBlurb',
        body: {
          en: 'Content OS demo — CMS-bound copy',
          'zh-CN': '内容操作系统演示 — 与 CMS 绑定的文案',
          'zh-TW': '內容作業系統示範 — 與 CMS 綁定的文案',
          ja: 'コンテンツOSデモ — CMS連携コピー',
        },
      },
      {
        key: 'website.hero.eyebrow',
        body: {
          en: 'One graph',
          'zh-CN': '一张图',
          'zh-TW': '一張圖',
          ja: '一枚のグラフ',
        },
      },
      {
        key: 'website.hero.title',
        body: {
          en: 'Table Content OS',
          'zh-CN': 'Table 内容操作系统',
          'zh-TW': 'Table 內容作業系統',
          ja: 'Table Content OS',
        },
      },
      {
        key: 'website.hero.subtitle',
        body: {
          en: 'Slides, site, brief, and ops — one source.',
          'zh-CN': '幻灯片、站点、简报与流程 — 同源。',
          'zh-TW': '簡報、網站、簡報與流程 — 同源。',
          ja: 'スライド、サイト、ブリーフ、業務 — 単一のソース。',
        },
      },
      {
        key: 'brief.executiveSummary',
        body: {
          en: 'Executive summary synced from Payload.',
          'zh-CN': '执行摘要（与 Payload 同步）。',
          'zh-TW': '執行摘要（與 Payload 同步）。',
          ja: 'Payload と同期したエグゼクティブサマリー。',
        },
      },
      {
        key: 'financials.headline',
        body: {
          en: 'Financials',
          'zh-CN': '财务',
          'zh-TW': '財務',
          ja: '財務',
        },
      },
      {
        key: 'training.moduleTitle',
        body: {
          en: 'Training',
          'zh-CN': '培训',
          'zh-TW': '培訓',
          ja: 'トレーニング',
        },
      },
      {
        key: 'sops.indexTitle',
        body: {
          en: 'Standard operating procedures',
          'zh-CN': '标准作业程序',
          'zh-TW': '標準作業程序',
          ja: '標準作業手順',
        },
      },
      {
        key: 'marketing-kit.packTitle',
        body: {
          en: 'Marketing kit',
          'zh-CN': '营销套件',
          'zh-TW': '行銷套件',
          ja: 'マーケティングキット',
        },
      },
      {
        key: 'succession.title',
        body: {
          en: 'Succession plan',
          'zh-CN': '继任计划',
          'zh-TW': '繼任計畫',
          ja: '後継計画',
        },
      },
    ];
    for (const row of seeds) {
      const createdDoc = await payload.create({
        collection: 'content-blocks',
        data: {
          key: row.key,
          body: row.body.en,
        },
        locale: 'en',
        overrideAccess: true,
      });
      const id = createdDoc.id;
      for (const loc of ['zh-CN', 'zh-TW', 'ja'] as const) {
        await payload.update({
          collection: 'content-blocks',
          id,
          data: { body: row.body[loc] },
          locale: loc,
          overrideAccess: true,
        });
      }
    }
  },
});
