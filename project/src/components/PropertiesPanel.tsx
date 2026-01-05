import { RotateCw, Trash2, Palette } from 'lucide-react';
import { EditorObject } from '../types/editor';

interface PropertiesPanelProps {
  object: EditorObject;
  onUpdate: (updates: Partial<EditorObject>) => void;
  onDelete: () => void;
}

export default function PropertiesPanel({ object, onUpdate, onDelete }: PropertiesPanelProps) {
  const colors = [
    { name: 'Brown', value: '#8B4513' },
    { name: 'Red', value: '#B22222' },
    { name: 'Blue', value: '#4169E1' },
    { name: 'Green', value: '#228B22' },
    { name: 'Gray', value: '#4A4A4A' },
    { name: 'Black', value: '#1a1a1a' },
  ];

  return (
    <div className="w-80 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 shadow-xl overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <h3 className="text-lg font-semibold mb-4">Properties</h3>

        <div className="space-y-4">
          {object.type === 'furniture' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={object.furnitureType || 'table'}
                  onChange={(e) => onUpdate({ furnitureType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/20 rounded-lg text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="table">Table</option>
                  <option value="sofa">Sofa</option>
                  <option value="chair">Chair</option>
                  <option value="bed">Bed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Width (cm)</label>
                  <input
                    type="number"
                    value={Math.round(object.width || 100)}
                    onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={Math.round(object.height || 100)}
                    onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rotation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={object.rotation || 0}
                    onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{Math.round(object.rotation || 0)}°</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Palette size={16} />
                  Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => onUpdate({ color: color.value })}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        object.color === color.value
                          ? 'border-white scale-110'
                          : 'border-white/30 hover:border-white/60'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-4 space-y-2">
            <button
              onClick={() => onUpdate({ rotation: ((object.rotation || 0) + 90) % 360 })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <RotateCw size={18} />
              Rotate 90°
            </button>

            <button
              onClick={onDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-all"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Delete:</span>
            <kbd className="px-2 py-0.5 bg-white/20 rounded">Del</kbd>
          </div>
          <div className="flex justify-between">
            <span>Cancel:</span>
            <kbd className="px-2 py-0.5 bg-white/20 rounded">Esc</kbd>
          </div>
          <div className="flex justify-between">
            <span>Finish Wall:</span>
            <kbd className="px-2 py-0.5 bg-white/20 rounded">Enter</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
