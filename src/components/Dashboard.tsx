import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminPanel } from './AdminPanel';
import { CreateTemplate } from './CreateTemplate';
import { TemplateList } from './TemplateList';
import { MessageSquare, Plus, LogOut, Shield, User } from 'lucide-react';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'admin'>('templates');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleTemplateUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Template Manager</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">{profile?.email}</span>
                {profile?.is_admin && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'templates'
                  ? 'bg-white text-green-700 shadow-sm border-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Templates
            </button>
            {profile?.is_admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-white text-green-700 shadow-sm border-2 border-green-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </div>

          {activeTab === 'templates' && (
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </button>
          )}
        </div>

        {activeTab === 'templates' ? (
          <TemplateList onRefresh={refreshKey} />
        ) : (
          <AdminPanel />
        )}
      </div>

      {showCreateTemplate && (
        <CreateTemplate
          onClose={() => setShowCreateTemplate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}