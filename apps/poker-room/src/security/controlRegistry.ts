import {
  canAccessPokerSurface,
  type PokerAccessContext,
  type PokerSurfaceGroup,
} from './accessPolicy';

export type PokerRouteView =
  | 'LANDING'
  | 'LOGIN'
  | 'LOBBY'
  | 'CONTROL CENTER'
  | 'CASH TABLES'
  | 'TOURNAMENTS'
  | 'WALLET'
  | 'HISTORY'
  | 'TABLE'
  | 'RESULTS'
  | 'PROFILE'
  | 'PROVABLY_FAIR'
  | 'MARKETPLACE'
  | 'COMMUNITY APPS'
  | 'LEADERBOARD'
  | 'SETTINGS';

export const ROUTE_SURFACE_POLICY: Record<PokerRouteView, PokerSurfaceGroup> = {
  LANDING: 'public_entry',
  LOGIN: 'public_entry',
  LOBBY: 'player_core',
  'CONTROL CENTER': 'operator_admin',
  'CASH TABLES': 'player_core',
  TOURNAMENTS: 'player_core',
  WALLET: 'player_core',
  HISTORY: 'player_core',
  TABLE: 'player_hud',
  RESULTS: 'player_core',
  PROFILE: 'player_core',
  PROVABLY_FAIR: 'player_core',
  MARKETPLACE: 'player_core',
  'COMMUNITY APPS': 'member_social',
  LEADERBOARD: 'player_core',
  SETTINGS: 'player_core',
};

type LobbyControl = {
  id: string;
  title: string;
  view: PokerRouteView;
  section: 'nav' | 'card' | 'operator';
  summary: string;
};

const LOBBY_CONTROLS: LobbyControl[] = [
  { id: 'nav-lobby', title: 'Lobby', view: 'LOBBY', section: 'nav', summary: 'Entry dashboard.' },
  {
    id: 'nav-cash',
    title: 'Cash Tables',
    view: 'CASH TABLES',
    section: 'nav',
    summary: 'Ring-game discovery.',
  },
  {
    id: 'nav-tourneys',
    title: 'Tournaments',
    view: 'TOURNAMENTS',
    section: 'nav',
    summary: 'SNG and MTT lobby.',
  },
  {
    id: 'nav-community',
    title: 'Community Apps',
    view: 'COMMUNITY APPS',
    section: 'nav',
    summary: 'Member app ecosystem.',
  },
  {
    id: 'nav-leaderboard',
    title: 'Leaderboard',
    view: 'LEADERBOARD',
    section: 'nav',
    summary: 'Performance rankings.',
  },
  {
    id: 'nav-wallet',
    title: 'Wallet',
    view: 'WALLET',
    section: 'nav',
    summary: 'Balance and cashier.',
  },
  {
    id: 'card-cash',
    title: 'Cash Games',
    view: 'CASH TABLES',
    section: 'card',
    summary: 'No-Limit Holdem ring games.',
  },
  {
    id: 'card-sng',
    title: 'Sit & Go',
    view: 'TOURNAMENTS',
    section: 'card',
    summary: 'Single-table tournaments.',
  },
  {
    id: 'card-mtt',
    title: 'Multi-Table Tournaments',
    view: 'TOURNAMENTS',
    section: 'card',
    summary: 'Scheduled large fields.',
  },
  {
    id: 'card-history',
    title: 'Hand History',
    view: 'HISTORY',
    section: 'card',
    summary: 'Past hand review and replay.',
  },
  {
    id: 'card-leaderboard',
    title: 'Leaderboard',
    view: 'LEADERBOARD',
    section: 'card',
    summary: 'Top player and agent ranks.',
  },
  {
    id: 'card-market',
    title: 'Staking Market',
    view: 'MARKETPLACE',
    section: 'card',
    summary: 'Back players and share outcomes.',
  },
  {
    id: 'card-community',
    title: 'Community Apps',
    view: 'COMMUNITY APPS',
    section: 'card',
    summary: 'Submit, vote, and launch apps.',
  },
  {
    id: 'card-fair',
    title: 'Provably Fair',
    view: 'PROVABLY_FAIR',
    section: 'card',
    summary: 'Verification and audit surfaces.',
  },
  {
    id: 'operator-center',
    title: 'Control Center',
    view: 'CONTROL CENTER',
    section: 'operator',
    summary: 'Admin/operator control surface.',
  },
];

export const getAllowedLobbyViews = (
  ctx: PokerAccessContext,
  section: LobbyControl['section']
): PokerRouteView[] => {
  const ordered = LOBBY_CONTROLS.filter((c) => c.section === section);
  const views: PokerRouteView[] = [];
  for (const control of ordered) {
    if (!canAccessPokerSurface(ctx, ROUTE_SURFACE_POLICY[control.view])) {
      continue;
    }
    if (!views.includes(control.view)) {
      views.push(control.view);
    }
  }
  return views;
};

export const getControlCenterSections = () => [
  {
    title: 'Player Surfaces',
    blurb: 'User-facing interfaces for live play, progression, and social participation.',
    controls: LOBBY_CONTROLS.filter((c) => c.section === 'nav' || c.section === 'card')
      .map((c) => `${c.title} (${c.view})`)
      .filter((value, index, self) => self.indexOf(value) === index),
  },
  {
    title: 'Operator Surfaces',
    blurb: 'Restricted controls for diagnostics, runtime operations, and policy enforcement.',
    controls: [
      'Control Center (CONTROL CENTER)',
      'Legacy Ops Shell: https://poker.ai-arcade.xyz/',
      'Table state init/round/settle and tournament lifecycle operations',
    ],
  },
  {
    title: 'Programmatic Surfaces',
    blurb: 'API-first channels intended for agent runtimes and orchestration services.',
    controls: [
      'POST /api/table/state/init',
      'POST /api/table/round/auto',
      'GET /api/table/state',
      'POST /api/v2/tournaments/* and /api/agents/*',
    ],
  },
];
