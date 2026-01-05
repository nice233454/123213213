import { MousePointer, Square, DoorOpen, RectangleHorizontal, Armchair, Trash2, CircleDot, Bed, Sofa } from 'lucide-react';
import { ToolType } from '../types/editor';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onAddFurniture: (type: 'table' | 'sofa' | 'chair' | 'bed') => void;
  onDelete: () => void;
  hasSelection: boolean;
}

export default function Toolbar({ currentTool, onToolChange, onAddFurniture, onDelete, hasSelection }: ToolbarProps) {
  const tools = [
    { id: 'select' as ToolType, icon: MousePointer, label: 'Select' },
    { id: 'wall' as ToolType, icon: Square, label: 'Wall' },
    { id: 'door' as ToolType, icon: DoorOpen, label: 'Door' },
    { id: 'window' as ToolType, icon: RectangleHorizontal, label: 'Window' },
  ];

  const furniture = [
    { type: 'table' as const, icon: CircleDot, label: 'Table' },
    { type: 'sofa' as const, icon: Sofa, label: 'Sofa' },
    { type: 'chair' as const, icon: Armchair, label: 'Chair' },
    { type: 'bed' as const, icon: Bed, label: 'Bed' },
  ];

  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-2">
      <div className="text-xs font-semibold text-gray-500 mb-2 px-2">TOOLS</div>

      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`w-14 h-14 flex items-center justify-center rounded-lg transition-all ${
            currentTool === tool.id
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          title={tool.label}
        >
          <tool.icon size={24} />
        </button>
      ))}

      <div className="h-px w-12 bg-gray-200 my-4" />

      <div className="text-xs font-semibold text-gray-500 mb-2 px-2">FURNITURE</div>

      {furniture.map(item => (
        <button
          key={item.type}
          onClick={() => onAddFurniture(item.type)}
          className="w-14 h-14 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
          title={item.label}
        >
          <item.icon size={24} />
        </button>
      ))}

      <div className="flex-1" />

      {hasSelection && (
        <button
          onClick={onDelete}
          className="w-14 h-14 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          title="Delete"
        >
          <Trash2 size={24} />
        </button>
      )}
    </div>
  );
}
