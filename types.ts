
export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  ZEN = 'Zen',
  FIREWORKS = 'Fireworks',
  SPHERE = 'Sphere',
  LIGUGU = 'Ligugu'
}

export interface AppState {
  currentShape: ShapeType;
  particleColor: string;
  handOpenness: number; // 0.0 (closed/fist) to 1.0 (open/spread)
  isHandDetected: boolean;
  setShape: (shape: ShapeType) => void;
  setColor: (color: string) => void;
  setHandStatus: (openness: number, detected: boolean) => void;
}

export const PARTICLE_COUNT = 8000;
