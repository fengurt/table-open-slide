import {
  HUB_AGENTS,
  HUB_CONTENT_OS,
  HUB_DECK_JOURNEYS,
  HUB_RUNTIMES,
  HUB_STUDIO,
  type HubEntry,
  type HubLink,
  projectToHubEntry,
  STATIC_EXTERNAL_DECK_JOURNEYS,
} from './hub-catalog';
import type { AtelierProject } from './projects';

export type LabSidebarItem = {
  id: string;
  label: string;
  icon: string;
  meta?: string;
  link: HubLink;
};

export type LabSidebarSection = {
  id: string;
  title: string;
  items: LabSidebarItem[];
};

const SIDEBAR_ICONS: Record<string, string> = {
  hub: '⌂',
  'html-lab': '◇',
  'docx-master': 'W',
  'page-generator': 'AI',
  'guizang-atelier-demo': 'G',
  '2day-fb-profit2chain': '餐',
  'kind-bp01': 'K',
  'open-slide-demo': 'R',
  'kind-viewer': 'K',
  'taiyuan-storyline': 'E',
  'web-docs': 'D',
  'cms-admin': 'C',
  brief: 'B',
  financials: '¥',
  training: 'T',
  sops: 'S',
  'marketing-kit': 'M',
  'succession-plan': 'P',
  website: 'W',
  'docx-mcp': 'M',
  'payload-mcp': 'M',
  'ppt-master': 'P',
  'guizang-skill': 'H',
  'docx-cli': 'W',
  'open-slide-cli': 'R',
  'kind-deck-authoring': 'K',
  'dev-stack': '↑',
};

function iconFor(id: string, fallbackTag?: string): string {
  if (SIDEBAR_ICONS[id]) return SIDEBAR_ICONS[id];
  if (fallbackTag) return fallbackTag.slice(0, 1).toUpperCase();
  return '·';
}

export function toSidebarItem(entry: HubEntry): LabSidebarItem {
  return {
    id: entry.id,
    label: entry.title,
    icon: iconFor(entry.id, entry.tag),
    meta: entry.meta,
    link: entry.link,
  };
}

export function deckSidebarItems(projects: AtelierProject[]): LabSidebarItem[] {
  return [
    ...projects.map((project) => toSidebarItem(projectToHubEntry(project))),
    ...STATIC_EXTERNAL_DECK_JOURNEYS.map(toSidebarItem),
  ];
}

/** Global left sidebar — same on every in-app route. */
export const LAB_SIDEBAR_SECTIONS: LabSidebarSection[] = [
  {
    id: 'studio',
    title: 'Studio',
    items: [
      {
        id: 'hub',
        label: 'Hub',
        icon: '⌂',
        meta: '/',
        link: { kind: 'route', to: '/' },
      },
      ...HUB_STUDIO.entries.map(toSidebarItem),
    ],
  },
  {
    id: 'decks',
    title: 'Decks',
    items: HUB_DECK_JOURNEYS.map(toSidebarItem),
  },
  {
    id: 'runtimes',
    title: 'Runtimes',
    items: HUB_RUNTIMES.entries.map(toSidebarItem),
  },
  {
    id: 'content-os',
    title: 'Content OS',
    items: HUB_CONTENT_OS.entries.map(toSidebarItem),
  },
  {
    id: 'agents',
    title: 'Agents',
    items: HUB_AGENTS.entries.map(toSidebarItem),
  },
];

export function labRouteTitle(pathname: string): string {
  if (pathname === '/') return 'Hub';
  if (pathname === '/lab') return 'HTML Lab';
  if (pathname === '/docx') return 'docx-master';
  if (pathname === '/projects') return 'AI Page Generator';
  if (pathname === '/admin') return 'Studio admin';
  if (pathname.startsWith('/project/')) {
    const id = pathname.slice('/project/'.length);
    const deck = HUB_DECK_JOURNEYS.find((d) => d.id === id);
    return deck?.title ?? 'Deck journey';
  }
  return 'Lab';
}

export function isSidebarItemActive(link: HubLink, pathname: string): boolean {
  if (link.kind !== 'route') return false;
  if (link.to === '/') return pathname === '/';
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}

/** Studio routes for top-bar quick switcher. */
export const LAB_STUDIO_ROUTES = ['/', '/projects', '/lab', '/docx'] as const;
