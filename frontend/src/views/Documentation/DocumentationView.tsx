import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Check, 
  Bookmark, 
  Terminal, 
  Info, 
  AlertTriangle
} from 'lucide-react';
import { DOC_SECTIONS } from './docContent';
import { DOC_CATEGORIES } from './docTypes';

export const DocumentationView: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('welcome');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOC_SECTIONS;
    const q = searchQuery.toLowerCase();
    return DOC_SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeSection = useMemo(() => {
    return DOC_SECTIONS.find((s) => s.id === activeSectionId) || DOC_SECTIONS[0];
  }, [activeSectionId]);

  const currentIndex = useMemo(() => {
    return DOC_SECTIONS.findIndex((s) => s.id === activeSection.id);
  }, [activeSection]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setActiveSectionId(DOC_SECTIONS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNext = () => {
    if (currentIndex < DOC_SECTIONS.length - 1) {
      setActiveSectionId(DOC_SECTIONS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
      {/* LEFT SIDEBAR: Index & Navigation */}
      <aside className="w-full lg:w-72 bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">APIx Project Manual</h2>
              <p className="text-[10px] text-slate-500 font-mono">SIH26056 Engineering Docs</p>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-sans"
            />
          </div>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 max-h-[700px] custom-scrollbar">
          {DOC_CATEGORIES.map((category) => {
            const categorySections = filteredSections.filter((s) => s.category === category);
            if (categorySections.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                  {category}
                </div>

                <div className="space-y-0.5">
                  {categorySections.map((sec) => {
                    const isActive = sec.id === activeSection.id;

                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveSectionId(sec.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between group ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate pr-2">{sec.title}</span>
                        {sec.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                              isActive
                                ? 'bg-blue-700 text-blue-100'
                                : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                            }`}
                          >
                            {sec.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT CONTENT PANE */}
      <main className="flex-1 flex flex-col bg-white overflow-y-auto max-h-[850px] custom-scrollbar">
        {/* Top Breadcrumb Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>DOCS</span>
            <span>/</span>
            <span className="text-slate-400 uppercase">{activeSection.category}</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">{activeSection.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(window.location.href)}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono px-2 py-1 bg-white border border-slate-200 rounded shadow-xs"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied Link' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-6 lg:p-8 flex-1">
          <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-sans text-sm space-y-4">
            {activeSection.content.split('\n\n').map((paragraph, idx) => {
              // Heading 1
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={idx} className="text-2xl font-bold text-slate-900 pb-2 border-b border-slate-200 tracking-tight">
                    {paragraph.replace('# ', '')}
                  </h1>
                );
              }
              // Heading 2
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 pt-2 border-b border-slate-100 tracking-tight flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-600 shrink-0" />
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              // Heading 3
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-sm font-semibold text-slate-900 mt-4 tracking-wide uppercase font-mono">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              // Code block
              if (paragraph.startsWith('```')) {
                const lines = paragraph.split('\n');
                const lang = lines[0].replace('```', '').trim();
                const codeBody = lines.slice(1, -1).join('\n');

                return (
                  <div key={idx} className="relative rounded-lg overflow-hidden my-4 border border-slate-300 shadow-xs">
                    <div className="bg-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-blue-400" />
                        <span>{lang || 'terminal'}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(codeBody)}
                        className="hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedCode === codeBody ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedCode === codeBody ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto m-0 leading-relaxed">
                      <code>{codeBody}</code>
                    </pre>
                  </div>
                );
              }
              // Note / Important Alert
              if (paragraph.startsWith('> [!NOTE]') || paragraph.startsWith('> [!IMPORTANT]')) {
                const isImportant = paragraph.includes('[!IMPORTANT]');
                const alertText = paragraph
                  .replace('> [!NOTE]', '')
                  .replace('> [!IMPORTANT]', '')
                  .replace(/^>\s+/gm, '')
                  .trim();

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border my-3 flex items-start gap-2.5 text-xs ${
                      isImportant
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    {isImportant ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed font-sans">{alertText}</div>
                  </div>
                );
              }
              // Table (markdown)
              if (paragraph.includes('|') && paragraph.includes('\n|')) {
                const lines = paragraph.split('\n').filter((l) => l.trim().startsWith('|'));
                if (lines.length >= 2) {
                  const headers = lines[0]
                    .split('|')
                    .slice(1, -1)
                    .map((h) => h.trim());
                  const rows = lines.slice(2).map((r) =>
                    r
                      .split('|')
                      .slice(1, -1)
                      .map((c) => c.trim())
                  );

                  return (
                    <div key={idx} className="overflow-x-auto my-4 border border-slate-200 rounded-lg shadow-xs">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold font-mono">
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className="py-2 px-3">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              }
              // Regular paragraph or bullet list
              if (paragraph.startsWith('* ') || paragraph.startsWith('1. ')) {
                return (
                  <div key={idx} className="my-2 pl-2 space-y-1 text-slate-700">
                    {paragraph.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{line.replace(/^(\*|\d+\.)\s+/, '')}</span>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <p key={idx} className="leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              );
            })}
          </article>
        </div>

        {/* Bottom Navigation: Prev / Next */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between mt-auto">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 hover:bg-white hover:text-blue-600 border border-slate-200 bg-white shadow-xs'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Section</span>
          </button>

          <span className="text-xs font-mono text-slate-500">
            {currentIndex + 1} of {DOC_SECTIONS.length}
          </span>

          <button
            onClick={goToNext}
            disabled={currentIndex === DOC_SECTIONS.length - 1}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentIndex === DOC_SECTIONS.length - 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-white bg-blue-600 hover:bg-blue-700 shadow-xs'
            }`}
          >
            <span>Next Section</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
