import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditorObject, ToolType, Point, EditorState } from '../types/editor';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import ProjectManager from './ProjectManager';
import { Project, updateProject } from '../lib/supabase';

const GRID_SIZE = 20;
const WALL_THICKNESS = 10;

export default function RoomEditor() {
  const [state, setState] = useState<EditorState>({
    objects: [],
    selectedId: null,
    tool: 'select',
    tempPoints: [],
    scale: 1,
    offset: { x: 0, y: 0 },
  });

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedNodeRef = useRef<Konva.Node | null>(null);

  useEffect(() => {
    if (transformerRef.current && selectedNodeRef.current) {
      transformerRef.current.nodes([selectedNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [state.selectedId]);

  const findNearestWall = (point: Point) => {
    const walls = state.objects.filter(obj => obj.type === 'wall');
    let nearestWall = null;
    let minDistance = Infinity;
    let nearestPosition = 0;

    for (const wall of walls) {
      if (!wall.points || wall.points.length < 2) continue;

      for (let i = 0; i < wall.points.length - 1; i++) {
        const p1 = wall.points[i];
        const p2 = wall.points[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) continue;

        const t = Math.max(0, Math.min(1, ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / (length * length)));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;

        const distance = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);

        if (distance < minDistance && distance < 50) {
          minDistance = distance;
          nearestWall = wall;
          nearestPosition = t;
        }
      }
    }

    return { wall: nearestWall, position: nearestPosition, point: nearestWall ? nearestPosition : null };
  };

  const handleCanvasClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    const snappedPoint = {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE,
    };

    if (state.tool === 'wall') {
      setState(prev => ({
        ...prev,
        tempPoints: [...prev.tempPoints, snappedPoint],
      }));
    } else if (state.tool === 'window' || state.tool === 'door') {
      const { wall } = findNearestWall(point);
      if (wall) {
        const newObject: EditorObject = {
          id: `${state.tool}-${Date.now()}`,
          type: state.tool,
          wallId: wall.id,
          x: point.x,
          y: point.y,
          width: state.tool === 'door' ? 80 : 60,
          height: WALL_THICKNESS,
          rotation: 0,
          color: state.tool === 'door' ? '#8B4513' : '#87CEEB',
        };
        setState(prev => ({
          ...prev,
          objects: [...prev.objects, newObject],
          selectedId: newObject.id,
        }));
      }
    } else if (state.tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setState(prev => ({ ...prev, selectedId: null }));
        selectedNodeRef.current = null;
      }
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && state.tool === 'wall' && state.tempPoints.length >= 2) {
      const newWall: EditorObject = {
        id: `wall-${Date.now()}`,
        type: 'wall',
        points: [...state.tempPoints, state.tempPoints[0]],
        color: '#1a1a1a',
      };
      setState(prev => ({
        ...prev,
        objects: [...prev.objects, newWall],
        tempPoints: [],
      }));
    } else if (e.key === 'Escape') {
      setState(prev => ({
        ...prev,
        tempPoints: [],
        tool: 'select',
      }));
    } else if (e.key === 'Delete' && state.selectedId) {
      setState(prev => ({
        ...prev,
        objects: prev.objects.filter(obj => obj.id !== state.selectedId),
        selectedId: null,
      }));
      selectedNodeRef.current = null;
    }
  }, [state.tool, state.tempPoints, state.selectedId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleObjectSelect = (id: string, node: Konva.Node) => {
    setState(prev => ({ ...prev, selectedId: id }));
    selectedNodeRef.current = node;
  };

  const handleObjectDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    setState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, x: node.x(), y: node.y() } : obj
      ),
    }));
  };

  const handleObjectTransform = (id: string, node: Konva.Node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    setState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id
          ? {
              ...obj,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, (obj.width || 100) * scaleX),
              height: Math.max(5, (obj.height || 100) * scaleY),
              rotation: node.rotation(),
            }
          : obj
      ),
    }));
  };

  const selectedObject = state.objects.find(obj => obj.id === state.selectedId);

  const updateSelectedObject = (updates: Partial<EditorObject>) => {
    setState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === state.selectedId ? { ...obj, ...updates } : obj
      ),
    }));
  };

  const addFurniture = (type: 'table' | 'sofa' | 'chair' | 'bed') => {
    const furniture: EditorObject = {
      id: `furniture-${Date.now()}`,
      type: 'furniture',
      furnitureType: type,
      x: 400,
      y: 300,
      width: type === 'table' ? 120 : type === 'sofa' ? 200 : type === 'chair' ? 60 : 180,
      height: type === 'table' ? 120 : type === 'sofa' ? 80 : type === 'chair' ? 60 : 200,
      rotation: 0,
      color: type === 'table' ? '#8B4513' : type === 'sofa' ? '#B22222' : type === 'chair' ? '#654321' : '#4A4A4A',
    };
    setState(prev => ({
      ...prev,
      objects: [...prev.objects, furniture],
      selectedId: furniture.id,
    }));
  };

  const deleteSelected = () => {
    if (state.selectedId) {
      setState(prev => ({
        ...prev,
        objects: prev.objects.filter(obj => obj.id !== state.selectedId),
        selectedId: null,
      }));
      selectedNodeRef.current = null;
      setHasUnsavedChanges(true);
    }
  };

  const handleLoadProject = (project: Project) => {
    setState({
      objects: project.data?.objects || [],
      selectedId: null,
      tool: 'select',
      tempPoints: [],
      scale: project.data?.scale || 1,
      offset: project.data?.offset || { x: 0, y: 0 },
    });
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setHasUnsavedChanges(false);
  };

  const handleNewProject = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Create a new project anyway?')) {
      return;
    }
    setState({
      objects: [],
      selectedId: null,
      tool: 'select',
      tempPoints: [],
      scale: 1,
      offset: { x: 0, y: 0 },
    });
    setCurrentProjectId(null);
    setCurrentProjectName('Untitled Project');
    setHasUnsavedChanges(false);
  };

  const handleProjectNameChange = (name: string) => {
    setCurrentProjectName(name);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [state.objects]);

  useEffect(() => {
    if (!currentProjectId || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(async () => {
      await updateProject(currentProjectId, {
        name: currentProjectName,
        data: { objects: state.objects, scale: state.scale, offset: state.offset },
      });
      setHasUnsavedChanges(false);
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [currentProjectId, currentProjectName, state.objects, state.scale, state.offset, hasUnsavedChanges]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Toolbar
        currentTool={state.tool}
        onToolChange={(tool) => setState(prev => ({ ...prev, tool, tempPoints: [] }))}
        onAddFurniture={addFurniture}
        onDelete={deleteSelected}
        hasSelection={!!state.selectedId}
      />

      <div className="flex-1 relative overflow-hidden">
        <ProjectManager
          currentProjectId={currentProjectId}
          currentProjectName={currentProjectName}
          objects={state.objects}
          scale={state.scale}
          offset={state.offset}
          onLoad={handleLoadProject}
          onNewProject={handleNewProject}
          onProjectNameChange={handleProjectNameChange}
        />
        <Stage
          ref={stageRef}
          width={window.innerWidth - (selectedObject ? 400 : 100)}
          height={window.innerHeight}
          onClick={handleCanvasClick}
          className="bg-white"
        >
          <Layer>
            {Array.from({ length: 100 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * GRID_SIZE, 0, i * GRID_SIZE, window.innerHeight]}
                stroke="#f5f5f5"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 100 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * GRID_SIZE, window.innerWidth, i * GRID_SIZE]}
                stroke="#f5f5f5"
                strokeWidth={1}
              />
            ))}
          </Layer>

          <Layer>
            {state.objects.map(obj => {
              if (obj.type === 'wall' && obj.points) {
                const flatPoints = obj.points.flatMap(p => [p.x, p.y]);
                return (
                  <Group key={obj.id}>
                    <Line
                      points={flatPoints}
                      stroke={obj.color || '#1a1a1a'}
                      strokeWidth={WALL_THICKNESS}
                      lineCap="round"
                      lineJoin="round"
                      closed
                      fill="transparent"
                      onClick={(e) => handleObjectSelect(obj.id, e.target)}
                    />
                  </Group>
                );
              }

              if (obj.type === 'window' || obj.type === 'door') {
                const isSelected = obj.id === state.selectedId;
                return (
                  <Group
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    draggable={state.tool === 'select'}
                    rotation={obj.rotation}
                    onClick={(e) => handleObjectSelect(obj.id, e.target.getParent()!)}
                    onDragEnd={(e) => handleObjectDragEnd(obj.id, e)}
                    onTransformEnd={(e) => handleObjectTransform(obj.id, e.target)}
                    ref={(node) => {
                      if (isSelected && node) {
                        selectedNodeRef.current = node;
                      }
                    }}
                  >
                    <Rect
                      width={obj.width}
                      height={obj.height}
                      offsetX={(obj.width || 0) / 2}
                      offsetY={(obj.height || 0) / 2}
                      fill={obj.color}
                      stroke={isSelected ? '#3B82F6' : '#666'}
                      strokeWidth={isSelected ? 3 : 1}
                    />
                    {obj.type === 'window' && (
                      <>
                        <Line
                          points={[-(obj.width || 0) / 2, 0, (obj.width || 0) / 2, 0]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        <Line
                          points={[0, -(obj.height || 0) / 2, 0, (obj.height || 0) / 2]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </Group>
                );
              }

              if (obj.type === 'furniture') {
                const isSelected = obj.id === state.selectedId;
                return (
                  <Group
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    draggable={state.tool === 'select'}
                    rotation={obj.rotation}
                    onClick={(e) => handleObjectSelect(obj.id, e.target.getParent()!)}
                    onDragEnd={(e) => handleObjectDragEnd(obj.id, e)}
                    onTransformEnd={(e) => handleObjectTransform(obj.id, e.target)}
                    ref={(node) => {
                      if (isSelected && node) {
                        selectedNodeRef.current = node;
                      }
                    }}
                  >
                    {obj.furnitureType === 'table' ? (
                      <Circle
                        radius={(obj.width || 120) / 2}
                        fill={obj.color}
                        stroke={isSelected ? '#3B82F6' : '#666'}
                        strokeWidth={isSelected ? 3 : 1}
                      />
                    ) : (
                      <Rect
                        width={obj.width}
                        height={obj.height}
                        offsetX={(obj.width || 0) / 2}
                        offsetY={(obj.height || 0) / 2}
                        fill={obj.color}
                        stroke={isSelected ? '#3B82F6' : '#666'}
                        strokeWidth={isSelected ? 3 : 1}
                        cornerRadius={obj.furnitureType === 'sofa' ? 5 : 0}
                      />
                    )}
                  </Group>
                );
              }

              return null;
            })}

            {state.tempPoints.length > 0 && (
              <>
                {state.tempPoints.map((point, i) => (
                  <Circle
                    key={i}
                    x={point.x}
                    y={point.y}
                    radius={5}
                    fill="#3B82F6"
                  />
                ))}
                {state.tempPoints.length > 1 && (
                  <Line
                    points={state.tempPoints.flatMap(p => [p.x, p.y])}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                )}
              </>
            )}

            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>

        {state.tool === 'wall' && (
          <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              Click to add points. Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to complete.
              Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to cancel.
            </p>
          </div>
        )}

        {(state.tool === 'window' || state.tool === 'door') && (
          <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              Click on a wall to place {state.tool === 'window' ? 'a window' : 'a door'}.
            </p>
          </div>
        )}
      </div>

      {selectedObject && (
        <PropertiesPanel
          object={selectedObject}
          onUpdate={updateSelectedObject}
          onDelete={deleteSelected}
        />
      )}
    </div>
  );
}
