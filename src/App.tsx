import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Download, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Code2,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useQuery, useMutation } from "convex/react";
// @ts-ignore
import { api } from "../convex/_generated/api";
// @ts-ignore
import type { Id } from "../convex/_generated/dataModel";
import './App.css';

const DEFAULT_HTML = `
<div class="hero">
  <h1>새로운 상품 출시!</h1>
  <p>이곳에서 당신의 상품을 소개하세요.</p>
  <button class="cta">지금 알아보기</button>
</div>
`;

const DEFAULT_CSS = `
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
}

h1 { font-size: 3rem; margin-bottom: 1rem; }
p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem; }

.cta {
  background: white;
  color: #6366f1;
  padding: 0.75rem 2rem;
  border-radius: 99px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.cta:hover { transform: scale(1.05); }
`;

export default function App() {
  const projects = (useQuery(api.projects.get) || []) as any[];
  const createProject = useMutation(api.projects.create);
  const updateProjectMutation = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  
  const activeProject = projects.find(p => p._id === activeId);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 10 && newWidth < 90) {
        setEditorWidth(newWidth);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const handleCreate = async () => {
    const id = await createProject({
      title: '새로운 랜딩페이지',
      html: DEFAULT_HTML,
      css: DEFAULT_CSS,
      js: '',
    });
    setActiveId(id);
  };

  const handleUpdate = (updates: Partial<any>) => {
    if (!activeId) return;
    updateProjectMutation({
      id: activeId as any,
      ...updates
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await removeProject({ id: id as any });
      if (activeId === id) setActiveId(null);
    }
  };

  const generateCombinedCode = () => {
    if (!activeProject) return '';
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeProject.title}</title>
  <style>
    ${activeProject.css}
  </style>
</head>
<body>
  ${activeProject.html}
  <script>
    ${activeProject.js}
  </script>
</body>
</html>
    `;
  };

  const downloadCode = () => {
    if (!activeProject) return;
    const code = generateCombinedCode();
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.title}.html`;
    a.click();
  };

  const saveAsImage = async () => {
    if (!previewRef.current || !activeProject) return;
    try {
      const canvas = await html2canvas(previewRef.current.contentDocument?.body as HTMLElement, {
        useCORS: true,
        scale: 2
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.title}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to save image', err);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  const filteredProjects = projects.filter((p: any) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="app-container">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0 }}
        className="sidebar"
      >
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Code2 className="violet-icon" style={{ color: '#8b5cf6' }} />
            <span>랜딩 DIY</span>
          </div>
          <button onClick={handleCreate} className="add-btn">
            <Plus size={18} />
          </button>
        </div>
        
        <div className="search-container">
          <div className="search-wrapper">
            <Search className="search-icon" size={14} />
            <input 
              type="text" 
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="project-list">
          {filteredProjects.map((p: any) => (
            <div 
              key={p._id}
              onClick={() => setActiveId(p._id)}
              className={`project-item ${activeId === p._id ? 'active' : ''}`}
            >
              <div className="project-info">
                <span className="project-name">{p.title}</span>
                <span className="project-date">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                className="delete-btn"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="main-content">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="toggle-sidebar"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {activeProject ? (
          <>
            <header className="toolbar">
              <div className="toolbar-left">
                <input 
                  type="text" 
                  value={activeProject.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  className="title-input"
                />
              </div>

              <div className="view-toggles">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                >
                  <Monitor size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('tablet')}
                  className={`view-btn ${viewMode === 'tablet' ? 'active' : ''}`}
                >
                  <Tablet size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                >
                  <Smartphone size={18} />
                </button>
              </div>

              <div className="actions">
                <button onClick={saveAsImage} className="action-btn">
                  <ImageIcon size={16} />
                  <span>이미지 저장</span>
                </button>
                <button onClick={downloadCode} className="action-btn primary">
                  <Download size={16} />
                  <span>코드 다운로드</span>
                </button>
              </div>
            </header>

            <div className="workspace">
              <div 
                className="editor-pane"
                style={{ width: `${editorWidth}%` }}
              >
                <div className="editor-section">
                  <div className="editor-label">
                    <span style={{ color: '#fb923c' }}>HTML</span>
                  </div>
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={activeProject.html}
                    onChange={(val) => handleUpdate({ html: val || '' })}
                    options={{ 
                      minimap: { enabled: false }, 
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      padding: { top: 10 }
                    }}
                  />
                </div>
                <div className="editor-section">
                  <div className="editor-label">
                    <span style={{ color: '#60a5fa' }}>CSS</span>
                  </div>
                  <Editor
                    height="100%"
                    defaultLanguage="css"
                    theme="vs-dark"
                    value={activeProject.css}
                    onChange={(val) => handleUpdate({ css: val || '' })}
                    options={{ 
                      minimap: { enabled: false }, 
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      padding: { top: 10 }
                    }}
                  />
                </div>
              </div>

              <div 
                className={`resizer ${isResizing ? 'dragging' : ''}`} 
                onMouseDown={startResizing}
              />

              <div className="preview-pane">
                {isResizing && <div style={{ position: 'absolute', inset: 0, zIndex: 5 }} />}
                <motion.div 
                  layout
                  className="preview-container"
                  style={{ 
                    width: viewMode === 'desktop' ? '100%' : viewMode === 'tablet' ? '768px' : '375px',
                    height: viewMode === 'desktop' ? '100%' : '80%',
                    maxWidth: '100%',
                    borderRadius: viewMode === 'desktop' ? '0' : '12px',
                    boxShadow: viewMode === 'desktop' ? 'none' : undefined
                  }}
                >
                  <iframe 
                    ref={previewRef}
                    title="Preview"
                    className="preview-iframe"
                    srcDoc={generateCombinedCode()}
                  />
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Code2 size={48} />
            </div>
            <div>
              <h3 className="empty-title">프로젝트를 선택하거나 새로 만드세요</h3>
              <p className="empty-desc">Convex 실시간 백엔드로 데이터가 안전하게 저장됩니다.</p>
            </div>
            <button onClick={handleCreate} className="start-btn">
              <Plus size={20} />
              새 프로젝트 시작
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
