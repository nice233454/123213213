export type ToolType = 'select' | 'wall' | 'window' | 'door' | 'furniture';

export type ObjectType = 'wall' | 'window' | 'door' | 'furniture' | 'room';

export interface Point {
  x: number;
  y: number;
}

export interface EditorObject {
  id: string;
  type: ObjectType;
  points?: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  furnitureType?: 'table' | 'sofa' | 'chair' | 'bed';
  wallId?: string;
  position?: number;
}

export interface EditorState {
  objects: EditorObject[];
  selectedId: string | null;
  tool: ToolType;
  tempPoints: Point[];
  scale: number;
  offset: Point;
}
