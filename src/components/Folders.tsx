import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FolderPlus, FolderOpen, ChevronRight, Plus, X } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  company_name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FoldersProps {
  onFolderSelect: (folderId: string | null, companyName: string | null) => void;
  selectedFolderId: string | null;
}

export function Folders({ onFolderSelect, selectedFolderId }: FoldersProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('folders')
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (fetchError) throw fetchError;
      setFolders(data || []);
      
      // Create a default "generalized" folder if none exists
      if ((!data || data.length === 0)) {
        await createDefaultFolder();
      }
    } catch (err: any) {
      console.error('Error loading folders:', err);
      setError(err.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultFolder = async () => {
    if (!user) return;
    
    try {
      setError('');
      // Check if a "generalized" folder already exists
      const { data: existingFolders, error: fetchError } = await supabase
        .from('folders')
        .select('*')
        .eq('created_by', user.id)
        .eq('name', 'generalized')
        .limit(1);

      if (fetchError) throw fetchError;

      // If a generalized folder already exists, use it
      if (existingFolders && existingFolders.length > 0) {
        setFolders(existingFolders);
        return;
      }

      // Otherwise, create a new one
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: 'generalized',
          company_name: 'General',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => [...prev, data]);
    } catch (err: any) {
      console.error('Error creating default folder:', err);
      setError(err.message || 'Failed to create default folder');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !newFolderName.trim() || !newCompanyName.trim()) {
      const errorMsg = 'Please fill in both folder name and company name';
      setError(errorMsg);
      alert(errorMsg);
      return;
    }

    setCreating(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          company_name: newCompanyName.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      setNewFolderName('');
      setNewCompanyName('');
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('Error creating folder:', err);
      const errorMsg = err.message || 'Failed to create folder';
      setError(errorMsg);
      alert('Error creating folder: ' + errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFolder = (folderId: string, companyName: string) => {
    onFolderSelect(folderId, companyName);
  };

  const handleSelectAllTemplates = () => {
    onFolderSelect(null, null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Folders</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
          title="Create new folder"
        >
          <FolderPlus className="w-5 h-5" />
        </button>
      </div>

      {showCreateForm && (
        <div className="p-4 border-b border-gray-200">
          {error && (
            <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateFolder} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Marketing Campaigns"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewFolderName('');
                  setNewCompanyName('');
                  setError('');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        <button
          onClick={handleSelectAllTemplates}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition ${
            selectedFolderId === null ? 'bg-green-50' : ''
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
            <FolderOpen className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">All Templates</div>
            <div className="text-xs text-gray-500">{folders.length} folders</div>
          </div>
        </button>

        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleSelectFolder(folder.id, folder.company_name)}
            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition ${
              selectedFolderId === folder.id ? 'bg-green-50' : ''
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{folder.name}</div>
              <div className="text-xs text-gray-500 truncate">{folder.company_name}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}