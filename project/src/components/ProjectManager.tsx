import { useState, useEffect } from 'react';
import { Save, FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { Project, loadAllProjects, saveProject, updateProject, deleteProject } from '../lib/supabase';
import { EditorObject } from '../types/editor';

interface ProjectManagerProps {
  currentProjectId: string | null;
  currentProjectName: string;
  objects: EditorObject[];
  scale: number;
  offset: { x: number; y: number };
  onLoad: (project: Project) => void;
  onNewProject: () => void;
  onProjectNameChange: (name: string) => void;
}

export default function ProjectManager({
  currentProjectId,
  currentProjectName,
  objects,
  scale,
  offset,
  onLoad,
  onNewProject,
  onProjectNameChange,
}: ProjectManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setIsLoading(true);
    const loadedProjects = await loadAllProjects();
    setProjects(loadedProjects);
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const projectData = {
      name: currentProjectName,
      data: { objects, scale, offset },
    };

    if (currentProjectId) {
      await updateProject(currentProjectId, projectData);
    } else {
      const newProject = await saveProject(projectData);
      if (newProject) {
        onLoad(newProject);
      }
    }
    setIsSaving(false);
    await loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
      if (id === currentProjectId) {
        onNewProject();
      }
      await loadProjects();
    }
  };

  const handleLoadProject = async (project: Project) => {
    onLoad(project);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="absolute top-4 left-24 flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
        <input
          type="text"
          value={currentProjectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Project name"
        />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          title="Save Project"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="Open Project"
        >
          <FolderOpen size={18} />
          Open
        </button>

        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="New Project"
        >
          <Plus size={18} />
          New
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800">Your Projects</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No projects yet. Create your first project!
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        project.id === currentProjectId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{project.name}</h3>
                        <p className="text-sm text-gray-500">
                          {project.data?.objects?.length || 0} objects • Last updated: {formatDate(project.updated_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadProject(project)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
