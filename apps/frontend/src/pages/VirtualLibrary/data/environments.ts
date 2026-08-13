import type { LibraryEnvironment } from '../types';

export const RUNDELL_LIBRARY: LibraryEnvironment = {
  id: 'rundell-public-library',
  name: 'Rundell Public Library',
  description:
    'Art Deco civic library in Rochester, NY. Built 1936. Main reading room with 10 DDC-organized bays.',
  location: 'Rochester, NY, USA',
  era: '1936-present',
  architecturalStyle: 'Art Deco / Neoclassical',
  primaryClassification: 'ddc',
  floors: [
    {
      id: 'rundell-floor-1',
      name: 'Main Reading Room',
      rooms: [
        {
          id: 'rundell-reading-room',
          name: 'Grand Reading Room',
          width: 30,
          depth: 20,
          height: 5,
          shelves: [
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `shelf-left-${i}`,
              position: { x: -14.5, y: 0, z: -8 + i * 4 },
              rotation: Math.PI / 2,
              classificationRange: `${i * 2}00-${i * 2}99`,
              rows: 5,
            })),
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `shelf-right-${i}`,
              position: { x: 14.5, y: 0, z: -8 + i * 4 },
              rotation: -Math.PI / 2,
              classificationRange: `${i * 2 + 1}00-${i * 2 + 1}99`,
              rows: 5,
            })),
          ],
          furniture: [
            { type: 'table' as const, position: { x: 0, y: 0, z: 0 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: -2, y: 0, z: 0 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: 2, y: 0, z: 0 }, rotation: 0 },
            { type: 'chair' as const, position: { x: -1, y: 0, z: 0.8 }, rotation: Math.PI },
            { type: 'chair' as const, position: { x: 1, y: 0, z: 0.8 }, rotation: Math.PI },
            { type: 'reading-stand' as const, position: { x: 5, y: 0, z: -3 }, rotation: 0 },
            { type: 'display-case' as const, position: { x: 0, y: 0, z: -9 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: -7, y: 0, z: -6 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: 7, y: 0, z: -6 }, rotation: 0 },
            { type: 'chair' as const, position: { x: -5, y: 0, z: 2 }, rotation: 0 },
            { type: 'chair' as const, position: { x: 5, y: 0, z: 2 }, rotation: 0 },
          ],
        },
      ],
    },
    {
      id: 'rundell-floor-2',
      name: 'Reference & Periodicals',
      rooms: [
        {
          id: 'rundell-reference-room',
          name: 'Reference Hall',
          width: 20,
          depth: 15,
          height: 4,
          shelves: [
            {
              id: 'shelf-ref-0',
              position: { x: -9, y: 0, z: 0 },
              rotation: Math.PI / 2,
              classificationRange: '000-099',
              rows: 4,
            },
            {
              id: 'shelf-ref-1',
              position: { x: 9, y: 0, z: 0 },
              rotation: -Math.PI / 2,
              classificationRange: '100-199',
              rows: 4,
            },
          ],
          furniture: [
            { type: 'table' as const, position: { x: 0, y: 0, z: 0 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: 0, y: 0, z: 2 }, rotation: 0 },
          ],
        },
      ],
    },
  ],
};

export const LIBRARY_OF_CONGRESS: LibraryEnvironment = {
  id: 'library-of-congress-jefferson',
  name: 'Library of Congress — Jefferson Building',
  description:
    'The Thomas Jefferson Building, the oldest of the Library of Congress buildings. Beaux-Arts masterpiece with LCC-organized reading rooms.',
  location: 'Washington, D.C., USA',
  era: '1897-present',
  architecturalStyle: 'Beaux-Arts / Italian Renaissance',
  primaryClassification: 'lcc',
  floors: [
    {
      id: 'loc-floor-great-hall',
      name: 'Great Hall & Main Reading Room',
      rooms: [
        {
          id: 'loc-great-hall',
          name: 'Great Hall',
          width: 40,
          depth: 30,
          height: 12,
          shelves: [
            {
              id: 'loc-shelf-a',
              position: { x: -18, y: 0, z: -10 },
              rotation: Math.PI / 2,
              classificationRange: 'A-AG',
              rows: 6,
            },
            {
              id: 'loc-shelf-b',
              position: { x: -18, y: 0, z: 0 },
              rotation: Math.PI / 2,
              classificationRange: 'BL-BX',
              rows: 6,
            },
            {
              id: 'loc-shelf-c',
              position: { x: -18, y: 0, z: 10 },
              rotation: Math.PI / 2,
              classificationRange: 'C-CT',
              rows: 6,
            },
            {
              id: 'loc-shelf-d',
              position: { x: 18, y: 0, z: -10 },
              rotation: -Math.PI / 2,
              classificationRange: 'D-DX',
              rows: 6,
            },
            {
              id: 'loc-shelf-e',
              position: { x: 18, y: 0, z: 0 },
              rotation: -Math.PI / 2,
              classificationRange: 'E-F',
              rows: 6,
            },
            {
              id: 'loc-shelf-g',
              position: { x: 18, y: 0, z: 10 },
              rotation: -Math.PI / 2,
              classificationRange: 'G-GV',
              rows: 6,
            },
          ],
          furniture: [
            { type: 'table' as const, position: { x: -6, y: 0, z: 0 }, rotation: 0 },
            { type: 'table' as const, position: { x: 6, y: 0, z: 0 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: -6, y: 0, z: 2 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: 6, y: 0, z: 2 }, rotation: 0 },
            { type: 'reading-stand' as const, position: { x: 0, y: 0, z: -8 }, rotation: 0 },
            { type: 'display-case' as const, position: { x: 0, y: 0, z: 12 }, rotation: 0 },
          ],
        },
        {
          id: 'loc-main-reading-room',
          name: 'Main Reading Room',
          width: 35,
          depth: 25,
          height: 10,
          shelves: [
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `loc-reading-shelf-left-${i}`,
              position: { x: -16, y: 0, z: -10 + i * 5 },
              rotation: Math.PI / 2,
              classificationRange: ['H', 'J', 'K', 'L', 'M'][i],
              rows: 6,
            })),
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `loc-reading-shelf-right-${i}`,
              position: { x: 16, y: 0, z: -10 + i * 5 },
              rotation: -Math.PI / 2,
              classificationRange: ['N', 'P', 'Q', 'R', 'S'][i],
              rows: 6,
            })),
          ],
          furniture: [
            { type: 'table' as const, position: { x: -4, y: 0, z: 0 }, rotation: 0 },
            { type: 'table' as const, position: { x: 4, y: 0, z: 0 }, rotation: 0 },
            { type: 'chair' as const, position: { x: -5, y: 0, z: 1 }, rotation: Math.PI },
            { type: 'chair' as const, position: { x: -3, y: 0, z: 1 }, rotation: Math.PI },
            { type: 'chair' as const, position: { x: 3, y: 0, z: 1 }, rotation: Math.PI },
            { type: 'chair' as const, position: { x: 5, y: 0, z: 1 }, rotation: Math.PI },
            { type: 'lamp' as const, position: { x: -4, y: 0, z: -1 }, rotation: 0 },
            { type: 'lamp' as const, position: { x: 4, y: 0, z: -1 }, rotation: 0 },
            { type: 'reading-stand' as const, position: { x: 0, y: 0, z: -6 }, rotation: 0 },
          ],
        },
      ],
    },
  ],
};

export const ENVIRONMENTS: LibraryEnvironment[] = [
  RUNDELL_LIBRARY,
  LIBRARY_OF_CONGRESS,
];

export function getEnvironmentById(
  id: string,
): LibraryEnvironment | undefined {
  return ENVIRONMENTS.find((e) => e.id === id);
}
