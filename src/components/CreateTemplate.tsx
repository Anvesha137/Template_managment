import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, X, Plus, Trash2, Upload, GripVertical, ChevronDown, Bold, Italic, Strikethrough, Smile } from 'lucide-react';
import { TemplatePreview } from './TemplatePreview';

type Category = 'Marketing' | 'Utility' | 'Authentication';

const CATEGORY_OPTIONS: Category[] = ['Marketing', 'Utility', 'Authentication'];

const SUBCATEGORY_OPTIONS: Record<Category, string[]> = {
  Marketing: ['Default', 'Catalogue'],
  Utility: ['Default'],
  Authentication: ['One-time passcode'],
};

const VALIDITY_PERIODS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
  { label: '15 minutes', value: 900 },
  { label: '30 minutes', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '3 hours', value: 10800 },
  { label: '6 hours', value: 21600 },
  { label: '12 hours', value: 43200 },
];

const HEADER_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
];

const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Custom', group: 'Quick reply' },
  { value: 'URL', label: 'Visit website', group: 'Call to action' },
  { value: 'PHONE_NUMBER', label: 'Call phone number', group: 'Call to action' },
  { value: 'WHATSAPP_CALL', label: 'Call on WhatsApp', group: 'Call to action' },
  { value: 'COPY_CODE', label: 'Copy offer code', group: 'Call to action' },
];

interface Button {
  type: string;
  text: string;
  url?: string;
  urlType?: string;
  phoneNumber?: string;
  countryCode?: string;
  offerCode?: string;
  activeDays?: number;
}

interface CreateTemplateProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTemplate({ onClose, onSuccess }: CreateTemplateProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>('Marketing');
  const [subcategory, setSubcategory] = useState('Default');
  const [templateName, setTemplateName] = useState('');
  const [language, setLanguage] = useState('en');

  const [headerType, setHeaderType] = useState('none');
  const [headerText, setHeaderText] = useState('');
  const [headerMediaSample, setHeaderMediaSample] = useState('');
  const [headerMediaFilename, setHeaderMediaFilename] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [content, setContent] = useState('');
  const [footerText, setFooterText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const [buttons, setButtons] = useState<Button[]>([]);

  const [catalogueId, setCatalogueId] = useState('');
  const [catalogueFormat, setCatalogueFormat] = useState('full');

  const [validityPeriod, setValidityPeriod] = useState<number | null>(null);
  const [useValidityPeriod, setUseValidityPeriod] = useState(false);

  const [codeDeliveryMethod, setCodeDeliveryMethod] = useState('zero_tap');
  const [addSecurityRecommendation, setAddSecurityRecommendation] = useState(false);
  const [codeExpiryMinutes, setCodeExpiryMinutes] = useState<number | null>(null);
  const [packageName, setPackageName] = useState('');
  const [signatureHash, setSignatureHash] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    setSubcategory(SUBCATEGORY_OPTIONS[newCategory][0]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingMedia(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('template-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-media')
        .getPublicUrl(fileName);

      setHeaderMediaSample(publicUrl);
      setHeaderMediaFilename(file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingMedia(false);
    }
  };

  useEffect(() => {
    if (category === 'Authentication') {
      const authContent = `{{1}} is your verification code.${addSecurityRecommendation ? ' For your security, do not share this code.' : ''}`;
      setContent(authContent);
    }
  }, [category, addSecurityRecommendation]);

  const addButton = () => {
    if (buttons.length < 10) {
      setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
    }
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: string, value: any) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'strikethrough') => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `*${selectedText}*`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'strikethrough':
        formattedText = `~${selectedText}~`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const newContent = content.substring(0, start) + emoji + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);

    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😊', '👍', '❤️', '🎉', '🔥', '✨', '💯', '🙏', '👏', '💪', '🎁', '🌟', '✅', '💰', '🚀', '⭐', '🎊', '💝', '🏆', '🎯'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const buttonConfig = buttons.length > 0 ? { buttons } : null;

      const { error: insertError } = await supabase.from('templates').insert({
        name: templateName,
        template_name: templateName,
        language,
        category,
        subcategory,
        content,
        header_type: headerType,
        header_text: headerType === 'text' ? headerText : null,
        header_media_sample: ['image', 'video', 'document'].includes(headerType) ? headerMediaSample : null,
        header_media_filename: ['image', 'video', 'document'].includes(headerType) ? headerMediaFilename : null,
        footer_text: footerText || null,
        media_url: null,
        has_buttons: buttons.length > 0,
        button_config: buttonConfig,
        catalogue_id: subcategory === 'Catalogue' ? catalogueId : null,
        catalogue_format: subcategory === 'Catalogue' ? catalogueFormat : null,
        validity_period: useValidityPeriod ? validityPeriod : null,
        code_delivery_method: category === 'Authentication' ? codeDeliveryMethod : null,
        add_security_recommendation: category === 'Authentication' ? addSecurityRecommendation : false,
        code_expiry_minutes: category === 'Authentication' ? codeExpiryMinutes : null,
        package_name: category === 'Authentication' ? packageName : null,
        signature_hash: category === 'Authentication' ? signatureHash : null,
        status: 'draft',
        created_by: user.id,
      });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const isMarketingDefault = category === 'Marketing' && subcategory === 'Default';
  const isMarketingCatalogue = category === 'Marketing' && subcategory === 'Catalogue';
  const isUtility = category === 'Utility';
  const isAuthentication = category === 'Authentication';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Create WhatsApp Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto pr-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Category</label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition text-sm ${
                        category === cat
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Template Type</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  {SUBCATEGORY_OPTIONS[category].map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    required
                    maxLength={512}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="en"
                  />
                </div>
              </div>

              {isMarketingCatalogue && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Catalogue Setup</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catalogue Format</label>
                    <select
                      value={catalogueFormat}
                      onChange={(e) => setCatalogueFormat(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="full">Catalogue message - Full catalogue</option>
                      <option value="multi_product">Multi-product message - Up to 30 products</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catalogue ID</label>
                    <input
                      type="text"
                      value={catalogueId}
                      onChange={(e) => setCatalogueId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Enter catalogue ID"
                    />
                  </div>
                </div>
              )}

              {(isMarketingDefault || isMarketingCatalogue) && (
                <div className="space-y-4">
                  {!isMarketingCatalogue && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header Type</label>
                        <select
                          value={headerType}
                          onChange={(e) => setHeaderType(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        >
                          {HEADER_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {headerType === 'text' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Header Text
                          </label>
                          <input
                            type="text"
                            value={headerText}
                            onChange={(e) => setHeaderText(e.target.value)}
                            maxLength={60}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            placeholder="Add a short line of text"
                          />
                          <p className="text-xs text-gray-500 mt-1">{headerText.length}/60</p>
                        </div>
                      )}

                      {['image', 'video', 'document'].includes(headerType) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Media Sample
                          </label>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                                  <Upload className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {uploadingMedia ? 'Uploading...' : 'Upload from computer'}
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept={headerType === 'image' ? 'image/*' : headerType === 'video' ? 'video/*' : 'application/pdf'}
                                  onChange={handleFileUpload}
                                  disabled={uploadingMedia}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <span className="text-gray-500 text-sm">OR</span>
                              </div>
                              <input
                                type="url"
                                value={headerMediaSample}
                                onChange={(e) => setHeaderMediaSample(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                placeholder="Enter URL: https://example.com/image.jpg"
                              />
                            </div>

                            {headerMediaSample && (
                              <div className="text-xs text-gray-500 break-all">
                                Selected: {headerMediaSample}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body <span className="text-red-500">*</span>
                    </label>

                    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => applyFormatting('bold')}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('italic')}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('strikethrough')}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Strikethrough"
                        >
                          <Strikethrough className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-1.5 hover:bg-gray-200 rounded transition"
                            title="Add emoji"
                          >
                            <Smile className="w-4 h-4 text-gray-600" />
                          </button>

                          {showEmojiPicker && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowEmojiPicker(false)}
                              />
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-20 w-64">
                                <div className="text-xs text-gray-500 mb-2 font-medium">Select emoji</div>
                                <div className="grid grid-cols-10 gap-1">
                                  {commonEmojis.map((emoji, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => insertEmoji(emoji)}
                                      className="text-xl hover:bg-gray-100 rounded p-1 transition"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <textarea
                        ref={setTextareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={5}
                        maxLength={1024}
                        className="w-full px-4 py-2 outline-none resize-none"
                        placeholder="Enter text in English"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        Use *bold*, _italic_, ~strikethrough~
                      </p>
                      <p className="text-xs text-gray-500">{content.length}/1024</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Footer <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Enter text"
                    />
                    <p className="text-xs text-gray-500 mt-1">{footerText.length}/60</p>
                  </div>
                </div>
              )}

              {isMarketingDefault && (
                <div className="space-y-4">
                  {buttons.length < 10 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={addButton}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-between text-sm font-medium text-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add button
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}

                  {buttons.map((button, index) => {
                    const buttonTypeInfo = BUTTON_TYPES.find(t => t.value === button.type);
                    const sectionTitle = buttonTypeInfo?.group || 'Button';

                    return (
                      <div key={index} className="border-t border-gray-200 pt-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="mt-2 text-gray-400 hover:text-gray-600 cursor-move"
                          >
                            <GripVertical className="w-5 h-5" />
                          </button>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {buttonTypeInfo?.label || 'Button'}
                                </div>
                                <div className="text-xs text-gray-500">• {sectionTitle}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeButton(index)}
                                className="text-gray-400 hover:text-red-500 transition"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={button.type}
                                onChange={(e) => updateButton(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                              >
                                {BUTTON_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
                              <input
                                type="text"
                                value={button.text}
                                onChange={(e) => updateButton(index, 'text', e.target.value)}
                                maxLength={25}
                                placeholder="Button text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                              />
                              <div className="text-right text-xs text-gray-500 mt-1">{button.text.length}/25</div>
                            </div>

                            {button.type === 'URL' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">URL type</label>
                                  <select
                                    value={button.urlType || 'Static'}
                                    onChange={(e) => updateButton(index, 'urlType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                  >
                                    <option value="Static">Static</option>
                                    <option value="Dynamic">Dynamic</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                  <input
                                    type="url"
                                    value={button.url || ''}
                                    onChange={(e) => updateButton(index, 'url', e.target.value)}
                                    placeholder="https://www.example.com"
                                    maxLength={2000}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                  />
                                  <div className="text-right text-xs text-gray-500 mt-1">0/2000</div>
                                </div>
                              </>
                            )}

                            {button.type === 'PHONE_NUMBER' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                  <select
                                    value={button.countryCode || 'US +1'}
                                    onChange={(e) => updateButton(index, 'countryCode', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                  >
                                    <option value="US +1">US +1</option>
                                    <option value="UK +44">UK +44</option>
                                    <option value="IN +91">IN +91</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                                  <input
                                    type="tel"
                                    value={button.phoneNumber || ''}
                                    onChange={(e) => updateButton(index, 'phoneNumber', e.target.value)}
                                    placeholder="Phone number"
                                    maxLength={20}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                  />
                                  <div className="text-right text-xs text-gray-500 mt-1">0/20</div>
                                  {!button.phoneNumber && (
                                    <p className="text-xs text-red-500 mt-1">You need to enter a phone number. Please add a valid phone number.</p>
                                  )}
                                </div>
                              </>
                            )}

                            {button.type === 'WHATSAPP_CALL' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Active for</label>
                                  <select
                                    value={button.activeDays || 7}
                                    onChange={(e) => updateButton(index, 'activeDays', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                  >
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                  </select>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-700">
                                  <div className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">ℹ</span>
                                    <div>
                                      Turn on calling in the <a href="#" className="text-blue-600 hover:underline">WhatsApp Manager portal</a>. Alternatively, you can use the Phone Number Settings API. <a href="#" className="text-blue-600 hover:underline">About calling on WhatsApp</a>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {button.type === 'COPY_CODE' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer code</label>
                                  <input
                                    type="text"
                                    value={button.offerCode || ''}
                                    onChange={(e) => updateButton(index, 'offerCode', e.target.value)}
                                    placeholder="Enter sample"
                                    maxLength={15}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                  />
                                  <div className="text-right text-xs text-gray-500 mt-1">0/15</div>
                                  {!button.offerCode && (
                                    <button type="button" className="text-xs text-red-500 mt-1 hover:underline">
                                      Add sample text
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isUtility && subcategory === 'Default' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header <span className="text-gray-400">(Optional)</span>
                    </label>
                    <select
                      value={headerType}
                      onChange={(e) => setHeaderType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="none">None</option>
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                    </select>
                  </div>

                  {headerType === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        maxLength={60}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="Enter text"
                      />
                      <p className="text-xs text-gray-500 mt-1">{headerText.length}/60</p>
                    </div>
                  )}

                  {['image', 'video', 'document'].includes(headerType) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sample {headerType.charAt(0).toUpperCase() + headerType.slice(1)}
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                              <div className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {uploadingMedia ? 'Uploading...' : `Upload ${headerType}`}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept={headerType === 'image' ? 'image/*' : headerType === 'video' ? 'video/*' : 'application/pdf'}
                                onChange={handleFileUpload}
                                disabled={uploadingMedia}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500 text-sm">OR</span>
                            </div>
                            <input
                              type="url"
                              value={headerMediaSample}
                              onChange={(e) => setHeaderMediaSample(e.target.value)}
                              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              placeholder="Enter URL: https://example.com/image.jpg"
                            />
                          </div>

                          {headerMediaSample && (
                            <div className="text-xs text-gray-500 break-all">
                              Selected: {headerMediaSample}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body <span className="text-red-500">*</span>
                    </label>

                    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => applyFormatting('bold')}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('italic')}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('strikethrough')}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Strikethrough"
                        >
                          <Strikethrough className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-1.5 hover:bg-gray-200 rounded transition"
                            title="Add emoji"
                          >
                            <Smile className="w-4 h-4 text-gray-600" />
                          </button>

                          {showEmojiPicker && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowEmojiPicker(false)}
                              />
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-20 w-64">
                                <div className="text-xs text-gray-500 mb-2 font-medium">Select emoji</div>
                                <div className="grid grid-cols-10 gap-1">
                                  {commonEmojis.map((emoji, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => insertEmoji(emoji)}
                                      className="text-xl hover:bg-gray-100 rounded p-1 transition"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <textarea
                        ref={setTextareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={5}
                        maxLength={1024}
                        className="w-full px-4 py-2 outline-none resize-none"
                        placeholder="Enter text in English"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        Use *bold*, _italic_, ~strikethrough~
                      </p>
                      <p className="text-xs text-gray-500">{content.length}/1024</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Footer <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Enter text"
                    />
                    <p className="text-xs text-gray-500 mt-1">{footerText.length}/60</p>
                  </div>

                  <div className="space-y-4">
                    {buttons.length < 10 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={addButton}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-between text-sm font-medium text-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add button
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}

                    {buttons.map((button, index) => {
                      const buttonTypeInfo = BUTTON_TYPES.find(t => t.value === button.type);
                      const sectionTitle = buttonTypeInfo?.group || 'Button';

                      return (
                        <div key={index} className="border-t border-gray-200 pt-4">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              className="mt-2 text-gray-400 hover:text-gray-600 cursor-move"
                            >
                              <GripVertical className="w-5 h-5" />
                            </button>

                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {buttonTypeInfo?.label || 'Button'}
                                  </div>
                                  <div className="text-xs text-gray-500">• {sectionTitle}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeButton(index)}
                                  className="text-gray-400 hover:text-red-500 transition"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  value={button.type}
                                  onChange={(e) => updateButton(index, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                  {BUTTON_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
                                <input
                                  type="text"
                                  value={button.text}
                                  onChange={(e) => updateButton(index, 'text', e.target.value)}
                                  maxLength={25}
                                  placeholder="Button text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">{button.text.length}/25</div>
                              </div>

                              {button.type === 'URL' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL type</label>
                                    <select
                                      value={button.urlType || 'Static'}
                                      onChange={(e) => updateButton(index, 'urlType', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                      <option value="Static">Static</option>
                                      <option value="Dynamic">Dynamic</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                    <input
                                      type="url"
                                      value={button.url || ''}
                                      onChange={(e) => updateButton(index, 'url', e.target.value)}
                                      placeholder="https://www.example.com"
                                      maxLength={2000}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <div className="text-right text-xs text-gray-500 mt-1">0/2000</div>
                                  </div>
                                </>
                              )}

                              {button.type === 'PHONE_NUMBER' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <select
                                      value={button.countryCode || 'US +1'}
                                      onChange={(e) => updateButton(index, 'countryCode', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                      <option value="US +1">US +1</option>
                                      <option value="UK +44">UK +44</option>
                                      <option value="IN +91">IN +91</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                                    <input
                                      type="tel"
                                      value={button.phoneNumber || ''}
                                      onChange={(e) => updateButton(index, 'phoneNumber', e.target.value)}
                                      placeholder="Phone number"
                                      maxLength={20}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <div className="text-right text-xs text-gray-500 mt-1">0/20</div>
                                    {!button.phoneNumber && (
                                      <p className="text-xs text-red-500 mt-1">You need to enter a phone number. Please add a valid phone number.</p>
                                    )}
                                  </div>
                                </>
                              )}

                              {button.type === 'WHATSAPP_CALL' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Active for</label>
                                    <select
                                      value={button.activeDays || 7}
                                      onChange={(e) => updateButton(index, 'activeDays', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                      <option value={7}>7 days</option>
                                      <option value={14}>14 days</option>
                                      <option value={30}>30 days</option>
                                    </select>
                                  </div>

                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-700">
                                    <div className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-0.5">ℹ</span>
                                      <div>
                                        Turn on calling in the <a href="#" className="text-blue-600 hover:underline">WhatsApp Manager portal</a>. Alternatively, you can use the Phone Number Settings API. <a href="#" className="text-blue-600 hover:underline">About calling on WhatsApp</a>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {button.type === 'COPY_CODE' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer code</label>
                                    <input
                                      type="text"
                                      value={button.offerCode || ''}
                                      onChange={(e) => updateButton(index, 'offerCode', e.target.value)}
                                      placeholder="Enter sample"
                                      maxLength={15}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    />
                                    <div className="text-right text-xs text-gray-500 mt-1">0/15</div>
                                    {!button.offerCode && (
                                      <button type="button" className="text-xs text-red-500 mt-1 hover:underline">
                                        Add sample text
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useValidityPeriod}
                        onChange={(e) => {
                          setUseValidityPeriod(e.target.checked);
                          if (!e.target.checked) setValidityPeriod(null);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">Set custom validity period for your message</span>
                        <p className="text-xs text-gray-500 mt-1">
                          If not set, the standard 10 minutes WhatsApp message validity period will be applied.
                        </p>
                      </div>
                    </label>

                    {useValidityPeriod && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Validity Period (minutes)</label>
                        <input
                          type="number"
                          value={validityPeriod || ''}
                          onChange={(e) => setValidityPeriod(parseInt(e.target.value) || null)}
                          min={1}
                          max={43200}
                          placeholder="Enter minutes (1-43200)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum: 43,200 minutes (30 days)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isAuthentication && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Code Delivery Setup</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
                    <div className="space-y-2">
                      {['zero_tap', 'one_tap', 'copy_code'].map((method) => (
                        <label key={method} className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value={method}
                            checked={codeDeliveryMethod === method}
                            onChange={(e) => setCodeDeliveryMethod(e.target.value)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {method === 'zero_tap' && 'Zero-tap auto-fill'}
                              {method === 'one_tap' && 'One-tap auto-fill'}
                              {method === 'copy_code' && 'Copy code'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {method === 'zero_tap' && 'Automatically send code without tapping'}
                              {method === 'one_tap' && 'Send code when customer taps button'}
                              {method === 'copy_code' && 'Customer copies and pastes code'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {codeDeliveryMethod !== 'copy_code' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Package Name
                        </label>
                        <input
                          type="text"
                          value={packageName}
                          onChange={(e) => setPackageName(e.target.value)}
                          maxLength={224}
                          placeholder="com.example.myapplication"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          App Signature Hash
                        </label>
                        <input
                          type="text"
                          value={signatureHash}
                          onChange={(e) => setSignatureHash(e.target.value)}
                          maxLength={11}
                          placeholder="Enter signature"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addSecurityRecommendation}
                      onChange={(e) => setAddSecurityRecommendation(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">Add security recommendation</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codeExpiryMinutes !== null}
                      onChange={(e) => setCodeExpiryMinutes(e.target.checked ? 5 : null)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">Add expiry time for the code</span>
                  </label>

                  {codeExpiryMinutes !== null && (
                    <input
                      type="number"
                      value={codeExpiryMinutes}
                      onChange={(e) => setCodeExpiryMinutes(parseInt(e.target.value))}
                      min={1}
                      placeholder="Minutes"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="lg:sticky lg:top-6">
            <TemplatePreview
              category={category}
              subcategory={subcategory}
              headerType={headerType}
              headerText={headerText}
              headerMediaSample={headerMediaSample}
              headerMediaFilename={headerMediaFilename}
              content={content}
              footerText={footerText}
              buttons={buttons}
              catalogueFormat={catalogueFormat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
