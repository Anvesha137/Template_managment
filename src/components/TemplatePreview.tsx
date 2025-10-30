import { Copy, ExternalLink, Phone, FileText, Play } from 'lucide-react';

interface TemplatePreviewProps {
  category: string;
  subcategory: string;
  headerType: string;
  headerText: string;
  headerMediaSample: string;
  headerMediaFilename?: string;
  content: string;
  footerText: string;
  buttons: any[];
  catalogueFormat?: string;
}

export function TemplatePreview({
  category,
  subcategory,
  headerType,
  headerText,
  headerMediaSample,
  headerMediaFilename,
  content,
  footerText,
  buttons,
  catalogueFormat,
}: TemplatePreviewProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isAuthentication = category === 'Authentication';
  const isCatalogue = subcategory === 'Catalogue';

  const formatText = (text: string) => {
    const parts: Array<{ text: string; bold?: boolean; italic?: boolean; strikethrough?: boolean }> = [];
    let currentText = '';
    let i = 0;

    while (i < text.length) {
      if (text[i] === '*' && text[i + 1] && text.indexOf('*', i + 1) !== -1) {
        if (currentText) {
          parts.push({ text: currentText });
          currentText = '';
        }
        const endIndex = text.indexOf('*', i + 1);
        parts.push({ text: text.substring(i + 1, endIndex), bold: true });
        i = endIndex + 1;
      } else if (text[i] === '_' && text[i + 1] && text.indexOf('_', i + 1) !== -1) {
        if (currentText) {
          parts.push({ text: currentText });
          currentText = '';
        }
        const endIndex = text.indexOf('_', i + 1);
        parts.push({ text: text.substring(i + 1, endIndex), italic: true });
        i = endIndex + 1;
      } else if (text[i] === '~' && text[i + 1] && text.indexOf('~', i + 1) !== -1) {
        if (currentText) {
          parts.push({ text: currentText });
          currentText = '';
        }
        const endIndex = text.indexOf('~', i + 1);
        parts.push({ text: text.substring(i + 1, endIndex), strikethrough: true });
        i = endIndex + 1;
      } else {
        currentText += text[i];
        i++;
      }
    }

    if (currentText) {
      parts.push({ text: currentText });
    }

    return parts.map((part, index) => {
      let className = '';
      if (part.bold) className = 'font-bold';
      if (part.italic) className = 'italic';
      if (part.strikethrough) className = 'line-through';

      return className ? (
        <span key={index} className={className}>
          {part.text}
        </span>
      ) : (
        <span key={index}>{part.text}</span>
      );
    });
  };

  return (
    <div className="bg-gray-50 p-8 rounded-xl">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Template preview</h3>

      <div className="bg-[#e5ddd5] p-4 rounded-lg max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isCatalogue ? (
            <div className="relative">
              <div className="bg-gray-200 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-16 h-16 bg-gray-300 rounded flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">View Catalog</p>
                    <p className="text-xs text-gray-600 mt-0.5">Browse pictures and details of our offerings.</p>
                  </div>
                </div>

                {content && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{formatText(content)}</p>
                )}
              </div>

              <div className="p-3 border-t border-gray-100">
                <button className="w-full text-[#00a5f4] font-medium text-sm py-1">
                  View catalog
                </button>
              </div>

              <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
                {currentTime}
              </div>
            </div>
          ) : (
            <>
              {headerType === 'image' && headerMediaSample && (
                <div className="w-full h-48 bg-gray-200">
                  <img
                    src={headerMediaSample}
                    alt="Header"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {headerType === 'video' && headerMediaSample && (
                <div className="w-full h-48 bg-gray-900 relative flex items-center justify-center">
                  <video
                    src={headerMediaSample}
                    className="w-full h-full object-cover"
                    controls
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 rounded-full p-3">
                      <Play className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>
                </div>
              )}

              {headerType === 'document' && headerMediaSample && (
                <div className="w-full bg-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {headerMediaFilename || headerMediaSample.split('/').pop() || 'Document'}
                      </p>
                      <p className="text-xs text-gray-500">PDF Document</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3">
                {headerType === 'text' && headerText && (
                  <p className="font-bold text-gray-900 mb-2">{headerText}</p>
                )}

                {content && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mb-1">
                    {formatText(content)}
                  </p>
                )}

                {footerText && (
                  <p className="text-xs text-gray-500 mt-2">{footerText}</p>
                )}

                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">{currentTime}</span>
                </div>
              </div>

              {buttons && buttons.length > 0 && (
                <div className="border-t border-gray-100">
                  {buttons.map((button, index) => (
                    <button
                      key={index}
                      className="w-full text-[#00a5f4] font-medium text-sm py-2.5 border-b border-gray-100 last:border-b-0 flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                      {button.type === 'PHONE_NUMBER' && <Phone className="w-4 h-4" />}
                      {button.type === 'WHATSAPP_CALL' && <Phone className="w-4 h-4" />}
                      {button.type === 'URL' && <ExternalLink className="w-4 h-4" />}
                      {button.type === 'COPY_CODE' && <Copy className="w-4 h-4" />}
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
