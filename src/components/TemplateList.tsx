import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Trash2, Eye, Calendar, User, Edit, Tag } from 'lucide-react';
import { TemplatePreview } from './TemplatePreview';
import { EditTemplate } from './EditTemplate';

interface Template {
  id: string;
  name: string;
  template_name: string | null;
  language: string | null;
  category: string;
  subcategory: string;
  content: string;
  header_type: string | null;
  header_text: string | null;
  header_media_sample: string | null;
  header_media_filename: string | null;
  footer_text: string | null;
  media_url: string | null;
  has_buttons: boolean;
  button_config: any;
  catalogue_id: string | null;
  catalogue_format: string | null;
  validity_period: number | null;
  code_delivery_method: string | null;
  add_security_recommendation: boolean | null;
  code_expiry_minutes: number | null;
  package_name: string | null;
  signature_hash: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  company_name: string | null;
  user_profiles?: {
    email: string;
  };
}

interface TemplateListProps {
  onRefresh?: number;
  folderId?: string | null;
  companyName?: string | null;
}

export function TemplateList({ onRefresh, folderId, companyName }: TemplateListProps) {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();

    const channel = supabase
      .channel('templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates',
        },
        () => {
          loadTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh, folderId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('Loading templates...', { folderId, companyName });
      
      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by folder if specified
      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else if (companyName) {
        query = query.eq('company_name', companyName);
      }

      const { data, error } = await query;

      console.log('Templates query result:', { data, error, count: data?.length });

      if (error) {
        console.error('Error loading templates:', error);
        throw error;
      }

      if (data && profile?.is_admin) {
        const templatesWithUsers = await Promise.all(
          data.map(async (template) => {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('email')
              .eq('id', template.created_by)
              .maybeSingle();

            return {
              ...template,
              user_profiles: userProfile
            };
          })
        );
        console.log('Templates with users:', templatesWithUsers.length);
        setTemplates(templatesWithUsers);
      } else {
        console.log('Setting templates:', data?.length || 0);
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);

      if (error) throw error;
      loadTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleEditSuccess = () => {
    loadTemplates();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Marketing':
        return 'bg-blue-100 text-blue-700';
      case 'Utility':
        return 'bg-orange-100 text-orange-700';
      case 'Authentication':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {folderId ? 'Folder Templates' : companyName ? `${companyName} Templates` : (profile?.is_admin ? 'All Templates' : 'My Templates')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
            {profile?.is_admin ? ' from all users' : ''}
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No templates found</p>
            <p className="text-sm text-gray-500 mt-1">
              {folderId ? 'This folder is empty' : companyName ? `No templates for ${companyName}` : 'Create your first template to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {template.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          template.category
                        )}`}
                      >
                        {template.category}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          template.status
                        )}`}
                      >
                        {template.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{template.subcategory}</p>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {template.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(template.created_at).toLocaleDateString()}
                      </div>
                      {profile?.is_admin && template.user_profiles?.email && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {template.user_profiles.email}
                        </div>
                      )}
                      {template.company_name && (
                        <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          <Tag className="w-3.5 h-3.5" />
                          {template.company_name}
                        </div>
                      )}
                      {template.has_buttons && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">Has buttons</span>
                      )}
                      {template.media_url && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">Has media</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="View details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit template"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {user?.id === template.created_by && (
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete template"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Template Details</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <Eye className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedTemplate.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                      selectedTemplate.category
                    )}`}
                  >
                    {selectedTemplate.category}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedTemplate.status
                    )}`}
                  >
                    {selectedTemplate.status}
                  </span>
                  {selectedTemplate.company_name && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                      <Tag className="w-4 h-4 mr-1" />
                      {selectedTemplate.company_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name</label>
                  <p className="text-gray-900">{selectedTemplate.template_name || selectedTemplate.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                  <p className="text-gray-900">{selectedTemplate.language || 'en'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{selectedTemplate.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{selectedTemplate.subcategory}</p>
                </div>
              </div>

              {selectedTemplate.header_type && selectedTemplate.header_type !== 'none' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Header</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Type: {selectedTemplate.header_type}</p>
                    {selectedTemplate.header_text && (
                      <p className="text-gray-900">{selectedTemplate.header_text}</p>
                    )}
                    {selectedTemplate.header_media_sample && (
                      <a
                        href={selectedTemplate.header_media_sample}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-sm break-all"
                      >
                        {selectedTemplate.header_media_sample}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Body Content</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTemplate.content}</p>
                </div>
              </div>

              {selectedTemplate.footer_text && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Footer</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-900">{selectedTemplate.footer_text}</p>
                  </div>
                </div>
              )}

              {selectedTemplate.has_buttons && selectedTemplate.button_config && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Buttons</label>
                  <div className="space-y-2">
                    {selectedTemplate.button_config.buttons?.map((button: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{button.text}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {button.type}
                          </span>
                        </div>
                        {button.url && (
                          <p className="text-xs text-gray-600">URL: {button.url}</p>
                        )}
                        {button.phoneNumber && (
                          <p className="text-xs text-gray-600">Phone: {button.countryCode} {button.phoneNumber}</p>
                        )}
                        {button.offerCode && (
                          <p className="text-xs text-gray-600">Code: {button.offerCode}</p>
                        )}
                        {button.activeDays && (
                          <p className="text-xs text-gray-600">Active for: {button.activeDays} days</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate.catalogue_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Catalogue</label>
                  <p className="text-sm text-gray-900">ID: {selectedTemplate.catalogue_id}</p>
                  <p className="text-sm text-gray-900">Format: {selectedTemplate.catalogue_format}</p>
                </div>
              )}

              {selectedTemplate.validity_period && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Validity Period</label>
                  <p className="text-sm text-gray-900">{selectedTemplate.validity_period} minutes</p>
                </div>
              )}

              {selectedTemplate.category === 'Authentication' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Authentication Settings</label>
                  {selectedTemplate.code_delivery_method && (
                    <p className="text-sm text-gray-900">Delivery: {selectedTemplate.code_delivery_method}</p>
                  )}
                  {selectedTemplate.package_name && (
                    <p className="text-sm text-gray-900">Package: {selectedTemplate.package_name}</p>
                  )}
                  {selectedTemplate.signature_hash && (
                    <p className="text-sm text-gray-900">Signature: {selectedTemplate.signature_hash}</p>
                  )}
                  {selectedTemplate.code_expiry_minutes && (
                    <p className="text-sm text-gray-900">Code expiry: {selectedTemplate.code_expiry_minutes} minutes</p>
                  )}
                  {selectedTemplate.add_security_recommendation && (
                    <p className="text-sm text-green-700">✓ Security recommendation enabled</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-600">
                  {profile?.is_admin && selectedTemplate.user_profiles?.email && (
                    <div>
                      <span className="font-medium">Created by:</span>{' '}
                      {selectedTemplate.user_profiles.email}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(selectedTemplate.created_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>{' '}
                      {new Date(selectedTemplate.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <TemplatePreview
                category={selectedTemplate.category}
                subcategory={selectedTemplate.subcategory}
                headerType={selectedTemplate.header_type || 'none'}
                headerText={selectedTemplate.header_text || ''}
                headerMediaSample={selectedTemplate.header_media_sample || ''}
                headerMediaFilename={selectedTemplate.header_media_filename || undefined}
                content={selectedTemplate.content}
                footerText={selectedTemplate.footer_text || ''}
                buttons={selectedTemplate.button_config?.buttons || []}
                catalogueFormat={selectedTemplate.catalogue_format || undefined}
              />
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTemplate && (
        <EditTemplate
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}