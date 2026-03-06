/**
 * Mercedes Sprinter van SVG silhouettes for all 4 views.
 * All paths are designed for a 800x500 viewBox (side views)
 * or 400x500 viewBox (front/rear views).
 * Simplified, clean vector outlines clearly recognizable as a delivery van.
 */

export type ViewSide = 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT';

export interface SprinterView {
  viewBox: { width: number; height: number };
  /** Main body outline */
  bodyPath: string;
  /** Additional detail paths (windows, lights, etc.) */
  details: Array<{ path: string; fill?: string; stroke?: string }>;
}

const VIEWS: Record<ViewSide, SprinterView> = {
  LEFT: {
    viewBox: { width: 800, height: 500 },
    // Van body — left side profile
    bodyPath: [
      // Roof line from front to rear
      'M 120,160',
      'L 120,140',
      'Q 130,100 180,90',
      'L 620,90',
      'Q 660,90 680,100',
      'L 700,120',
      'L 700,340',
      // Rear wheel arch
      'Q 700,360 690,370',
      'A 45,45 0 0,1 600,370',
      'Q 590,360 590,340',
      'L 590,340',
      // Bottom between wheels
      'L 260,340',
      // Front wheel arch
      'Q 260,360 250,370',
      'A 45,45 0 0,1 160,370',
      'Q 150,360 150,340',
      // Front lower
      'L 120,340',
      'L 100,320',
      'L 100,200',
      'Z',
    ].join(' '),
    details: [
      // Windshield
      {
        path: 'M 130,145 L 145,108 Q 155,98 175,95 L 230,95 L 230,180 L 130,180 Z',
        fill: '#b8d4e8',
      },
      // Side windows (cab)
      {
        path: 'M 235,95 L 340,95 L 340,180 L 235,180 Z',
        fill: '#b8d4e8',
      },
      // Door line
      { path: 'M 340,95 L 340,340', stroke: '#666', fill: 'none' },
      // Sliding door track area
      { path: 'M 390,120 L 390,320', stroke: '#888', fill: 'none' },
      // Cargo door line
      { path: 'M 530,95 L 530,340', stroke: '#888', fill: 'none' },
      // Front headlight
      {
        path: 'M 102,205 L 115,205 L 115,235 L 102,235 Z',
        fill: '#f5e6a0',
      },
      // Rear taillight
      {
        path: 'M 695,140 L 702,140 L 702,180 L 695,180 Z',
        fill: '#e85050',
      },
      // Front bumper
      {
        path: 'M 100,300 L 155,300 L 155,335 L 100,335 Q 95,335 95,320 L 95,315 Q 95,300 100,300 Z',
        fill: '#555',
      },
      // Rear bumper
      {
        path: 'M 690,300 L 705,300 Q 710,300 710,315 L 710,320 Q 710,335 705,335 L 690,335 Z',
        fill: '#555',
      },
      // Front wheel
      {
        path: 'M 205,370 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0',
        fill: '#333',
      },
      // Front wheel hub
      {
        path: 'M 205,370 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0',
        fill: '#999',
      },
      // Rear wheel
      {
        path: 'M 645,370 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0',
        fill: '#333',
      },
      // Rear wheel hub
      {
        path: 'M 645,370 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0',
        fill: '#999',
      },
      // Side mirror
      {
        path: 'M 118,155 L 100,150 L 95,155 L 95,175 L 100,180 L 118,175 Z',
        fill: '#555',
      },
      // Door handle (cab)
      {
        path: 'M 310,200 L 335,200 L 335,207 L 310,207 Z',
        fill: '#888',
      },
      // Sliding door handle
      {
        path: 'M 395,200 L 405,200 L 405,230 L 395,230 Z',
        fill: '#888',
      },
    ],
  },

  RIGHT: {
    viewBox: { width: 800, height: 500 },
    // Mirrored left side
    bodyPath: [
      'M 680,160',
      'L 680,140',
      'Q 670,100 620,90',
      'L 180,90',
      'Q 140,90 120,100',
      'L 100,120',
      'L 100,340',
      // Rear wheel arch (now on left)
      'Q 100,360 110,370',
      'A 45,45 0 0,0 200,370',
      'Q 210,360 210,340',
      'L 210,340',
      // Bottom between wheels
      'L 540,340',
      // Front wheel arch (now on right)
      'Q 540,360 550,370',
      'A 45,45 0 0,0 640,370',
      'Q 650,360 650,340',
      // Front lower
      'L 680,340',
      'L 700,320',
      'L 700,200',
      'Z',
    ].join(' '),
    details: [
      // Windshield
      {
        path: 'M 670,145 L 655,108 Q 645,98 625,95 L 570,95 L 570,180 L 670,180 Z',
        fill: '#b8d4e8',
      },
      // Side window (cab)
      {
        path: 'M 565,95 L 460,95 L 460,180 L 565,180 Z',
        fill: '#b8d4e8',
      },
      // Door line
      { path: 'M 460,95 L 460,340', stroke: '#666', fill: 'none' },
      // Sliding door track
      { path: 'M 410,120 L 410,320', stroke: '#888', fill: 'none' },
      // Cargo door line
      { path: 'M 270,95 L 270,340', stroke: '#888', fill: 'none' },
      // Front headlight
      {
        path: 'M 685,205 L 698,205 L 698,235 L 685,235 Z',
        fill: '#f5e6a0',
      },
      // Rear taillight
      {
        path: 'M 98,140 L 105,140 L 105,180 L 98,180 Z',
        fill: '#e85050',
      },
      // Front bumper
      {
        path: 'M 645,300 L 700,300 Q 705,300 705,315 L 705,320 Q 705,335 700,335 L 645,335 Z',
        fill: '#555',
      },
      // Rear bumper
      {
        path: 'M 95,300 L 110,300 L 110,335 L 95,335 Q 90,335 90,320 L 90,315 Q 90,300 95,300 Z',
        fill: '#555',
      },
      // Front wheel
      {
        path: 'M 595,370 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0',
        fill: '#333',
      },
      // Front wheel hub
      {
        path: 'M 595,370 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0',
        fill: '#999',
      },
      // Rear wheel
      {
        path: 'M 155,370 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0',
        fill: '#333',
      },
      // Rear wheel hub
      {
        path: 'M 155,370 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0',
        fill: '#999',
      },
      // Side mirror
      {
        path: 'M 682,155 L 700,150 L 705,155 L 705,175 L 700,180 L 682,175 Z',
        fill: '#555',
      },
      // Door handle (cab)
      {
        path: 'M 465,200 L 490,200 L 490,207 L 465,207 Z',
        fill: '#888',
      },
      // Sliding door handle
      {
        path: 'M 395,200 L 405,200 L 405,230 L 395,230 Z',
        fill: '#888',
      },
    ],
  },

  FRONT: {
    viewBox: { width: 400, height: 500 },
    bodyPath: [
      'M 60,150',
      'L 60,120',
      'Q 70,80 120,70',
      'L 280,70',
      'Q 330,80 340,120',
      'L 340,150',
      'L 340,340',
      // Right wheel
      'Q 340,360 330,370',
      'A 35,35 0 0,1 260,370',
      'Q 255,360 255,340',
      // Bottom
      'L 145,340',
      // Left wheel
      'Q 145,360 140,370',
      'A 35,35 0 0,1 70,370',
      'Q 60,360 60,340',
      'Z',
    ].join(' '),
    details: [
      // Windshield
      {
        path: 'M 80,120 Q 85,85 130,78 L 270,78 Q 315,85 320,120 L 320,175 L 80,175 Z',
        fill: '#b8d4e8',
      },
      // Grille
      {
        path: 'M 100,200 L 300,200 L 300,260 L 100,260 Z',
        fill: '#444',
      },
      // Grille horizontal bars
      { path: 'M 105,215 L 295,215', stroke: '#666', fill: 'none' },
      { path: 'M 105,230 L 295,230', stroke: '#666', fill: 'none' },
      { path: 'M 105,245 L 295,245', stroke: '#666', fill: 'none' },
      // Mercedes star (simplified circle)
      {
        path: 'M 200,230 m -18,0 a 18,18 0 1,0 36,0 a 18,18 0 1,0 -36,0',
        fill: '#888',
      },
      // Left headlight
      {
        path: 'M 65,195 L 95,190 L 95,250 L 65,255 Z',
        fill: '#f5e6a0',
      },
      // Right headlight
      {
        path: 'M 305,190 L 335,195 L 335,255 L 305,250 Z',
        fill: '#f5e6a0',
      },
      // Bumper
      {
        path: 'M 55,280 L 345,280 L 345,330 Q 345,340 335,340 L 65,340 Q 55,340 55,330 Z',
        fill: '#555',
      },
      // Number plate area
      {
        path: 'M 135,290 L 265,290 L 265,320 L 135,320 Z',
        fill: '#eee',
      },
      // Left wheel
      {
        path: 'M 105,370 m -32,0 a 32,32 0 1,0 64,0 a 32,32 0 1,0 -64,0',
        fill: '#333',
      },
      // Left wheel hub
      {
        path: 'M 105,370 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0',
        fill: '#999',
      },
      // Right wheel
      {
        path: 'M 295,370 m -32,0 a 32,32 0 1,0 64,0 a 32,32 0 1,0 -64,0',
        fill: '#333',
      },
      // Right wheel hub
      {
        path: 'M 295,370 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0',
        fill: '#999',
      },
      // Left mirror
      {
        path: 'M 55,135 L 35,130 L 30,135 L 30,160 L 35,165 L 55,160 Z',
        fill: '#555',
      },
      // Right mirror
      {
        path: 'M 345,135 L 365,130 L 370,135 L 370,160 L 365,165 L 345,160 Z',
        fill: '#555',
      },
    ],
  },

  REAR: {
    viewBox: { width: 400, height: 500 },
    bodyPath: [
      'M 60,80',
      'L 340,80',
      'L 340,340',
      // Right wheel
      'Q 340,360 330,370',
      'A 35,35 0 0,1 260,370',
      'Q 255,360 255,340',
      // Bottom
      'L 145,340',
      // Left wheel
      'Q 145,360 140,370',
      'A 35,35 0 0,1 70,370',
      'Q 60,360 60,340',
      'Z',
    ].join(' '),
    details: [
      // Rear doors split line
      { path: 'M 200,85 L 200,330', stroke: '#666', fill: 'none' },
      // Left door window
      {
        path: 'M 80,95 L 195,95 L 195,200 L 80,200 Z',
        fill: '#b8d4e8',
      },
      // Right door window
      {
        path: 'M 205,95 L 320,95 L 320,200 L 205,200 Z',
        fill: '#b8d4e8',
      },
      // Left door handle
      {
        path: 'M 175,230 L 195,230 L 195,240 L 175,240 Z',
        fill: '#888',
      },
      // Right door handle
      {
        path: 'M 205,230 L 225,230 L 225,240 L 205,240 Z',
        fill: '#888',
      },
      // Left taillight
      {
        path: 'M 65,100 L 78,100 L 78,170 L 65,170 Z',
        fill: '#e85050',
      },
      // Right taillight
      {
        path: 'M 322,100 L 335,100 L 335,170 L 322,170 Z',
        fill: '#e85050',
      },
      // Bumper
      {
        path: 'M 55,290 L 345,290 L 345,330 Q 345,340 335,340 L 65,340 Q 55,340 55,330 Z',
        fill: '#555',
      },
      // Number plate area
      {
        path: 'M 135,295 L 265,295 L 265,325 L 135,325 Z',
        fill: '#eee',
      },
      // Left wheel
      {
        path: 'M 105,370 m -32,0 a 32,32 0 1,0 64,0 a 32,32 0 1,0 -64,0',
        fill: '#333',
      },
      // Left wheel hub
      {
        path: 'M 105,370 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0',
        fill: '#999',
      },
      // Right wheel
      {
        path: 'M 295,370 m -32,0 a 32,32 0 1,0 64,0 a 32,32 0 1,0 -64,0',
        fill: '#333',
      },
      // Right wheel hub
      {
        path: 'M 295,370 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0',
        fill: '#999',
      },
      // Left door hinge (top)
      {
        path: 'M 62,105 L 68,105 L 68,120 L 62,120 Z',
        fill: '#888',
      },
      // Left door hinge (bottom)
      {
        path: 'M 62,250 L 68,250 L 68,265 L 62,265 Z',
        fill: '#888',
      },
      // Right door hinge (top)
      {
        path: 'M 332,105 L 338,105 L 338,120 L 332,120 Z',
        fill: '#888',
      },
      // Right door hinge (bottom)
      {
        path: 'M 332,250 L 338,250 L 338,265 L 332,265 Z',
        fill: '#888',
      },
    ],
  },
};

export function getSprinterView(side: ViewSide): SprinterView {
  return VIEWS[side];
}

export const VIEW_LABELS: Record<ViewSide, string> = {
  FRONT: 'Vorne',
  REAR: 'Hinten',
  LEFT: 'Linke Seite',
  RIGHT: 'Rechte Seite',
};

export const ALL_VIEWS: ViewSide[] = ['FRONT', 'REAR', 'LEFT', 'RIGHT'];

export const VIEW_ORDER: Record<ViewSide, number> = { FRONT: 0, REAR: 1, LEFT: 2, RIGHT: 3 };
