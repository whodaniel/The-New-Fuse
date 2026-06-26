import { DESKTOP_ROUTES, getRouteByPath, type DesktopRoute } from './routes';

export interface UiPathway {
  id: string;
  path: string;
  label: string;
  group: string;
  keywords: string[];
  interact: {
    navigate: string;
    hashRoute: string;
    description: string;
  };
}

export function buildUiPathwayCatalog(): UiPathway[] {
  return DESKTOP_ROUTES.map((route: DesktopRoute) => ({
    id: route.id,
    path: route.path,
    label: route.label,
    group: route.group,
    keywords: route.keywords || [],
    interact: {
      navigate: route.path,
      hashRoute: `#${route.path}`,
      description: `Open ${route.label} in TNF Desktop via route ${route.path}`,
    },
  }));
}

export function pathwayForRoute(path: string): UiPathway | undefined {
  const route = getRouteByPath(path);
  if (!route) return undefined;
  return buildUiPathwayCatalog().find((p) => p.path === route.path);
}
