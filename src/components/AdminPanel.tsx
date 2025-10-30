import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Trash2, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: currentUser } = await supabase.auth.getUser();

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            is_admin: false,
            created_by: currentUser.user?.id,
          });

        if (profileError) throw profileError;

        setSuccess(`User ${newUserEmail} added successfully`);
        setNewUserEmail('');
        setNewUserPassword('');
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="userEmail"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="userPassword"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{user.email}</td>
                  <td className="py-3 px-4">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        User
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
