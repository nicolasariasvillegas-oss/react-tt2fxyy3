import React from "react";
import "./style.css";

export default function App() {
  return (
    <div>
      <h1>Hello StackBlitz!</h1>
      <p>Start editing to see some magic happen :)</p>
    </div>
  );
}
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  LayoutDashboard, 
  ListTodo, 
  Plus, 
  Trash2, 
  Edit,
  X,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Printer,
  MonitorDown,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Monitor,
  Smartphone,
  Download,
  Users,
  LogOut,
  ArrowRight,
  Save,
  Upload
} from 'lucide-react';

// Prevención de errores en entornos de previsualización
if (typeof window !== 'undefined') {
  window.tailwind = window.tailwind || { config: {} };
}

// ============================================================================
// VERSIÓN LOCAL (OFFLINE) CON RESPALDOS
// No requiere Firebase ni Internet. Todo se guarda en el navegador.
// ============================================================================

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day);
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const getDiffDays = (date1, date2) => {
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getSafeRecentClients = () => {
  try {
    const item = localStorage.getItem('agrimanage_recents');
    return item ? JSON.parse(item) : [];
  } catch (error) {
    return [];
  }
};

const saveSafeRecentClients = (clients) => {
  try {
    localStorage.setItem('agrimanage_recents', JSON.stringify(clients));
  } catch (error) {}
};

export default function App() {
  const [clientId, setClientId] = useState(() => {
    try { return localStorage.getItem('agrimanage_current_client') || ''; } catch(e) { return ''; }
  });
  const [recentClients, setRecentClients] = useState(getSafeRecentClients());
  const [tasks, setTasks] = useState([]);
  
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingCowsTask, setViewingCowsTask] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); 
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!clientId) return;
    try {
      const storedTasks = localStorage.getItem(`agrimanage_tasks_${clientId}`);
      if (storedTasks) {
        const parsed = JSON.parse(storedTasks);
        parsed.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setTasks(parsed);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error("Error leyendo memoria local", e);
      setTasks([]);
    }
  }, [clientId]);

  const syncTasksToStorage = (newTasks) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(`agrimanage_tasks_${clientId}`, JSON.stringify(newTasks));
      setSaveStatus('Guardado automático ✓');
      setTimeout(() => setSaveStatus(''), 3000);

      setRecentClients(prevRecents => {
        const updated = prevRecents.map(c => {
           const cSlug = typeof c === 'string' 
             ? c.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
             : (c.slug || (c.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
           
           if (cSlug === clientId) {
              return typeof c === 'string' 
                ? { name: c, slug: cSlug, lastUpdated: new Date().toISOString() } 
                : { ...c, lastUpdated: new Date().toISOString() };
           }
           return c;
        });
        saveSafeRecentClients(updated);
        return updated;
      });
    } catch (e) {
      console.error("Error guardando en memoria local", e);
    }
  };

  useEffect(() => {
    const manifest = {
      name: "AgriManage: Establo Manager",
      short_name: "AgriManage",
      description: "Sistema de control para establo",
      start_url: ".",
      display: "standalone",
      background_color: "#f8fafc",
      theme_color: "#064e3b",
      icons: [
        { src: "https://api.iconify.design/lucide:tractor.svg?color=%23064e3b", sizes: "192x192", type: "image/svg+xml" },
        { src: "https://api.iconify.design/lucide:tractor.svg?color=%23064e3b", sizes: "512x512", type: "image/svg+xml" }
      ]
    };
    
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;

    if ('serviceWorker' in navigator) {
      const swCode = `
        self.addEventListener('install', (e) => self.skipWaiting());
        self.addEventListener('activate', (e) => self.clients.claim());
        self.addEventListener('fetch', (e) => {
          e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
        });
      `;
      const swBlob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(swBlob);
      navigator.serviceWorker.register(swUrl).catch(() => {});
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      URL.revokeObjectURL(manifestURL);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      setShowInstallModal(true);
    }
  };

  const uniqueResponsibles = useMemo(() => {
    const responsibles = tasks.map(t => t.responsible).filter(Boolean);
    return [...new Set(responsibles)].sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterResponsible && t.responsible !== filterResponsible) return false;
      const tStart = t.startDate;
      const tEnd = t.newEndDate || t.endDate;
      if (filterStartDate && tEnd < filterStartDate) return false; 
      if (filterEndDate && tStart > filterEndDate) return false; 
      return true;
    });
  }, [tasks, filterResponsible, filterStartDate, filterEndDate]);

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.progress === 100).length;
  const pendingTasks = totalTasks - completedTasks;
  const avgProgress = totalTasks > 0 ? Math.round(filteredTasks.reduce((acc, t) => acc + Number(t.progress), 0) / totalTasks) : 0;

  const handleEnterClient = (name) => {
    if(!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let existingLastUpdated = new Date().toISOString();

    const filteredRecents = recentClients.filter(c => {
      if (!c) return false;
      const cSlug = typeof c === 'string' 
        ? c.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
        : (c.slug || (c.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
      if (cSlug === slug && typeof c !== 'string' && c.lastUpdated) existingLastUpdated = c.lastUpdated;
      return cSlug !== slug;
    });

    const newRecents = [ {name: name.trim(), slug, lastUpdated: existingLastUpdated}, ...filteredRecents ].slice(0, 15);
    saveSafeRecentClients(newRecents);
    setRecentClients(newRecents);
    try { localStorage.setItem('agrimanage_current_client', slug); } catch(e) {}
    setClientId(slug);
  };

  const handleSwitchClient = () => {
    try { localStorage.removeItem('agrimanage_current_client'); } catch(e) {}
    setClientId('');
    setTasks([]);
  };

  const handleRemoveClient = (clientToRemove) => {
    if (!clientToRemove) return;
    const clientName = typeof clientToRemove === 'string' ? clientToRemove : (clientToRemove.name || '');
    const clientSlug = typeof clientToRemove === 'string' 
      ? clientToRemove.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
      : (clientToRemove.slug || clientName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));

    if (!clientName) return;
    if (window.confirm(`¿Estás seguro de eliminar el establo "${clientName}"? Se borrarán de esta computadora todas sus tareas permanentemente.`)) {
      const newRecents = recentClients.filter(c => {
        if (!c) return false;
        const cSlug = typeof c === 'string' 
          ? c.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
          : (c.slug || (c.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        return cSlug !== clientSlug;
      });
      saveSafeRecentClients(newRecents);
      setRecentClients(newRecents);
      try { localStorage.removeItem(`agrimanage_tasks_${clientSlug}`); } catch(e) {}
    }
  };

  const handleDeleteCurrentClient = () => {
    if (window.confirm(`¿Estás completamente seguro de eliminar el establo actual y todas sus tareas? Esta acción NO se puede deshacer.`)) {
      const newRecents = recentClients.filter(c => {
        if (!c) return false;
        const cSlug = typeof c === 'string' 
          ? c.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
          : (c.slug || (c.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        return cSlug !== clientId;
      });
      saveSafeRecentClients(newRecents);
      setRecentClients(newRecents);
      try {
        localStorage.removeItem(`agrimanage_tasks_${clientId}`);
        localStorage.removeItem('agrimanage_current_client');
      } catch(e) {}
      setClientId('');
      setTasks([]);
    }
  };

  const handleSaveTask = (taskOrTasks) => {
    let newTasks = [...tasks];
    if (Array.isArray(taskOrTasks)) {
      newTasks = [...newTasks, ...taskOrTasks];
    } else {
      const task = taskOrTasks;
      const taskId = task.id ? task.id : Date.now().toString();
      const taskData = { ...task, id: taskId };
      if (editingTask) newTasks = tasks.map(t => t.id === taskId ? taskData : t);
      else newTasks.push(taskData);
    }
    newTasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    syncTasksToStorage(newTasks);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    syncTasksToStorage(newTasks);
  };

  const handleCompleteTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, progress: 100 } : t);
    syncTasksToStorage(newTasks);
  };

  const openNewTaskModal = () => { setEditingTask(null); setIsModalOpen(true); };
  const openEditTaskModal = (task) => { setEditingTask(task); setIsModalOpen(true); };

  const handlePrint = () => {
    try { window.print(); } catch (e) { console.error("Error al imprimir", e); }
    setTimeout(() => { setShowPrintModal(true); }, 500);
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Respaldo_${clientId}_${formatDate(new Date())}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTasks = JSON.parse(e.target.result);
        if (Array.isArray(importedTasks)) {
          if (window.confirm("¿Estás seguro de cargar este respaldo? Reemplazará todas las tareas actuales de este establo.")) {
            syncTasksToStorage(importedTasks);
          }
        } else alert("El archivo no tiene el formato correcto.");
      } catch (err) { alert("Error al leer el archivo de respaldo."); }
      if(fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (!clientId) {
    return <ClientSelector onSelect={handleEnterClient} recents={recentClients} onRemove={handleRemoveClient} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important;}
          .print-expand { overflow: visible !important; height: auto !important; min-height: auto !important; }
          @page { size: landscape; margin: 1cm; }
        }
      `}</style>

      <aside className="w-full md:w-64 bg-emerald-900 text-white flex flex-col md:min-h-screen shadow-xl z-10 print:hidden overflow-y-auto">
        <div className="p-6 pb-4">
          <h1 className="text-xl font-bold leading-tight flex items-center capitalize truncate" title={clientId.replace(/-/g, ' ')}>
            {clientId.replace(/-/g, ' ')}
          </h1>
          <p className="text-emerald-300 text-xs mt-1">Gestión Local Offline</p>
        </div>
        
        <nav className="flex-1 px-4 pb-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-800 text-white' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
            <LayoutDashboard size={20} /><span className="font-medium">Resumen</span>
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'list' ? 'bg-emerald-800 text-white' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
            <ListTodo size={20} /><span className="font-medium">Lista de Tareas</span>
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-emerald-800 text-white' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
            <CalendarRange size={20} /><span className="font-medium">Calendario de Acción</span>
          </button>
          <button onClick={() => setActiveTab('gantt')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'gantt' ? 'bg-emerald-800 text-white' : 'hover:bg-emerald-800/50 text-emerald-100'}`}>
            <Calendar size={20} /><span className="font-medium">Diagrama de Gantt</span>
          </button>
          
          <div className="my-4 border-t border-emerald-800 pt-4">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 px-4">Respaldos (Backup)</p>
          </div>

          <button onClick={handleExportBackup} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-emerald-800/50 text-blue-300 hover:text-white font-medium">
            <Save size={20} /><span>Descargar Respaldo</span>
          </button>
          <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-emerald-800/50 text-amber-300 hover:text-white font-medium">
            <Upload size={20} /><span>Cargar Respaldo</span>
          </button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} style={{display: 'none'}} />

          <div className="my-4 border-t border-emerald-800 pt-4"></div>
          
          <button onClick={handleSwitchClient} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-emerald-800/50 text-emerald-200 hover:text-white">
            <LogOut size={20} /><span>Cambiar Establo</span>
          </button>
          <button onClick={handleDeleteCurrentClient} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-red-900/60 text-red-300 hover:text-white mt-1">
            <Trash2 size={20} /><span>Borrar Establo</span>
          </button>
        </nav>

        <div className="p-4 mt-auto print:hidden">
          <button onClick={handleInstallClick} className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-3 rounded-lg transition-colors shadow-lg font-bold border border-emerald-400">
            <MonitorDown size={20} /><span>Instalar en la PC</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden print-expand">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {activeTab === 'dashboard' && 'Panel de Control General'}
              {activeTab === 'list' && 'Gestión de Actividades'}
              {activeTab === 'calendar' && 'Calendario Trimestral de Acción'}
              {activeTab === 'gantt' && 'Cronograma de Operaciones'}
            </h2>
            <div className="flex items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              <p className="text-sm text-slate-500">Modo Auditoría Local (Datos en este equipo)</p>
              {saveStatus && <span className="ml-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse border border-emerald-200">{saveStatus}</span>}
            </div>
            <div className="hidden print:block mt-2">
              <p className="text-sm text-slate-500">Reporte generado el: {new Date().toLocaleDateString()}</p>
              {(filterResponsible || filterStartDate || filterEndDate) && (
                <p className="text-sm font-bold text-slate-700 mt-1 bg-slate-100 p-2 rounded-md inline-block border border-slate-300">
                  Filtros Aplicados: 
                  {filterResponsible && ` | Resp: ${filterResponsible}`}
                  {filterStartDate && ` | Desde: ${filterStartDate}`}
                  {filterEndDate && ` | Hasta: ${filterEndDate}`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 print:hidden">
            <button onClick={handlePrint} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors shadow-sm" title="Imprimir o Guardar en PDF">
              <Printer size={18} /><span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button onClick={openNewTaskModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors shadow-sm">
              <Plus size={18} /><span className="hidden sm:inline">Nueva Actividad</span>
            </button>
          </div>
        </header>

        {tasks.length > 0 && (
          <div className="bg-slate-100/60 border-b border-slate-200 px-8 py-3 flex flex-wrap gap-4 items-center print:hidden shrink-0 shadow-inner">
            <span className="text-sm font-bold text-slate-600 flex items-center">Filtrar Visualización:</span>
            <select 
              value={filterResponsible} 
              onChange={e => setFilterResponsible(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-slate-700 shadow-sm"
            >
              <option value="">Todos los responsables</option>
              {uniqueResponsibles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600">Desde:</span>
              <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700 shadow-sm" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600">Hasta:</span>
              <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700 shadow-sm" />
            </div>
            {(filterResponsible || filterStartDate || filterEndDate) && (
              <button onClick={() => { setFilterResponsible(''); setFilterStartDate(''); setFilterEndDate(''); }} className="text-sm text-red-600 hover:text-red-800 font-bold px-3 py-2 transition-colors bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 ml-auto shadow-sm">
                Limpiar Filtros
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8 print-expand">
          {activeTab === 'dashboard' && <Dashboard totalTasks={totalTasks} completedTasks={completedTasks} pendingTasks={pendingTasks} avgProgress={avgProgress} />}
          {activeTab === 'list' && <TaskList tasks={filteredTasks} onEdit={openEditTaskModal} onDelete={handleDeleteTask} onViewCows={setViewingCowsTask} onComplete={handleCompleteTask} />}
          {activeTab === 'calendar' && <ActionCalendar tasks={filteredTasks} />}
          {activeTab === 'gantt' && <GanttChart tasks={filteredTasks} />}
        </div>
      </main>

      {isModalOpen && <TaskFormModal task={editingTask} existingTasks={tasks} onSave={handleSaveTask} onClose={() => setIsModalOpen(false)} />}
      {viewingCowsTask && <CowsListModal task={viewingCowsTask} onClose={() => setViewingCowsTask(null)} />}

      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center"><MonitorDown className="mr-2 text-emerald-600" /> Instalar Aplicación</h2>
              <button onClick={() => setShowInstallModal(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">Parece que tu navegador bloqueó la instalación automática. Esto ocurre porque estás probando la app dentro del chat.</p>
              <p className="text-slate-600 mb-2 font-semibold">Para instalarla y fijarla en tu PC:</p>
              <ol className="list-decimal pl-5 text-slate-600 space-y-2">
                <li>Usa StackBlitz y Vercel para publicar tu app (sigue las instrucciones del chat).</li>
                <li>Abre el enlace de Vercel en una pestaña nueva.</li>
                <li>Ahí sí podrás darle clic al ícono de instalar en la barra de direcciones.</li>
              </ol>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowInstallModal(false)} className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm">Entendido</button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center"><Printer className="mr-2 text-emerald-600" /> Imprimir / Exportar a PDF</h2>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-4 text-sm border border-amber-200">
                <strong>⚠️ Aviso:</strong> En este entorno de vista previa, el botón automático a veces es bloqueado.
              </div>
              <p className="text-slate-600 mb-3 font-semibold">Para imprimir o guardar como PDF usa tu teclado:</p>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start"><span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded mr-3">1</span><span>Presiona <strong>Ctrl + P</strong> (en Windows) o <strong>Cmd + P</strong> (en Mac).</span></li>
                <li className="flex items-start"><span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded mr-3">2</span><span>En "Destino", elige <strong>Guardar como PDF</strong>.</span></li>
              </ul>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowPrintModal(false)} className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientSelector({ onSelect, recents, onRemove }) {
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = (e) => { e.preventDefault(); onSelect(input); };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">AgriManage Auditor</h1>
          <p className="text-slate-500 mt-2">Plataforma de gestión local (Offline)</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Ingresar a un Establo</h2>
          {recents && recents.length > 0 && (
            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">Mis Establos Guardados</label>
              <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 text-left font-medium">
                <span>Seleccionar un establo...</span>
                <ChevronDown size={20} className={`transition-transform duration-200 text-slate-400 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {recents.map((client, idx) => {
                    const clientName = typeof client === 'string' ? client : client.name;
                    const dateStr = client.lastUpdated ? new Date(client.lastUpdated).toLocaleDateString('es-MX', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Sin registro';
                    return (
                      <div key={idx} className="flex items-center justify-between border-b border-slate-100 last:border-0 hover:bg-emerald-50 transition-colors group">
                        <div onClick={() => { setIsDropdownOpen(false); onSelect(clientName); }} className="flex-1 px-4 py-3 cursor-pointer">
                          <p className="font-bold text-slate-800 group-hover:text-emerald-800">{clientName}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center"><Clock size={12} className="mr-1 inline" /> {dateStr}</p>
                        </div>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(client); }} className="p-3 mx-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar establo"><Trash2 size={18} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {recents && recents.length > 0 && (
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">O crear uno nuevo</span><div className="flex-grow border-t border-slate-200"></div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Establo Nuevo</label>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej. Rancho Los Pinos" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-lg transition-all" />
            </div>
            <button type="submit" disabled={!input.trim()} className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-xl transition-colors shadow-md font-bold text-lg">
              <span>Acceder al Espacio Local</span><ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ totalTasks, completedTasks, pendingTasks, avgProgress }) {
  return (
    <div className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <StatCard title="Total Filtrado" value={totalTasks} icon={<ListTodo size={24} />} color="bg-blue-50 text-blue-600" />
        <StatCard title="Completadas" value={completedTasks} icon={<CheckCircle2 size={24} />} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pendientes" value={pendingTasks} icon={<Clock size={24} />} color="bg-amber-50 text-amber-600" />
        <StatCard title="Avance" value={`${avgProgress}%`} icon={<TrendingUp size={24} />} color="bg-purple-50 text-purple-600" />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-600 print:shadow-none print:border-slate-300">
        <h3 className="text-lg font-semibold mb-2 text-slate-800 flex items-center"><CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 print-color-adjust-exact" />Cultura de Trabajo</h3>
        <p className="text-slate-600 italic text-lg leading-relaxed pl-7">"La disciplina constante, la puntualidad en cada labor y el enfoque en los detalles son el puente que transforma nuestras metas en resultados excepcionales."</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center space-x-4 print:shadow-none print:border-slate-300 print:break-inside-avoid print:p-4">
      <div className={`p-4 rounded-lg print-color-adjust-exact print:p-3 ${color}`}>{icon}</div>
      <div><p className="text-slate-500 text-sm font-medium print:text-xs">{title}</p><p className="text-2xl font-bold text-slate-800 print:text-xl">{value}</p></div>
    </div>
  );
}

function ActionCalendar({ tasks }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthsToShow = useMemo(() => {
    return [0, 1, 2].map(offset => {
      const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const currentRangeLabel = monthsToShow[0].year === monthsToShow[2].year 
    ? `${new Date(monthsToShow[0].year, monthsToShow[0].month).toLocaleDateString('es-ES', { month: 'long' })} - ${new Date(monthsToShow[2].year, monthsToShow[2].month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
    : `${new Date(monthsToShow[0].year, monthsToShow[0].month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} - ${new Date(monthsToShow[2].year, monthsToShow[2].month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

  return (
    <div className="space-y-4 print-expand">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center print:hidden">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={24} /></button>
        <div className="text-center"><h3 className="text-lg font-bold text-slate-800 capitalize">{currentRangeLabel}</h3><p className="text-xs text-slate-500">Ventana de Acción de 3 Meses</p></div>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronRight size={24} /></button>
      </div>
      <div className="hidden print:block text-center mb-6"><h1 className="text-2xl font-bold text-slate-800">Calendario de Acción: {currentRangeLabel}</h1></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4 print-expand">
        {monthsToShow.map((m, idx) => <MonthView key={`${m.year}-${m.month}`} year={m.year} monthIndex={m.month} tasks={tasks} />)}
      </div>
    </div>
  );
}

function MonthView({ year, monthIndex, tasks }) {
  const date = new Date(year, monthIndex, 1);
  const monthName = date.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = date.getDay();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, monthIndex, i));
  while (days.length % 7 !== 0) days.push(null);

  return (
    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden flex flex-col print:break-inside-avoid shadow-sm print:shadow-none h-full">
      <div className="bg-emerald-800 text-center py-2 font-bold text-white print-color-adjust-exact">{monthName} {year}</div>
      <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-100 text-[10px] font-bold text-slate-600 text-center py-1 print-color-adjust-exact">
        <div>DOM</div><div>LUN</div><div>MAR</div><div>MIE</div><div>JUE</div><div>VIE</div><div>SAB</div>
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(80px,auto)] print:auto-rows-[minmax(60px,auto)]">
        {days.map((dayDate, idx) => {
          if (!dayDate) return <div key={idx} className="border-b border-r border-slate-200 bg-slate-50/50 print-color-adjust-exact"></div>;
          const actionTasks = [];
          tasks.forEach(t => {
            const start = parseDate(t.startDate);
            const end = parseDate(t.newEndDate || t.endDate);
            const dTime = dayDate.getTime();
            const sTime = start.getTime();
            const eTime = end.getTime();
            if (sTime === eTime && dTime === sTime) actionTasks.push({ ...t, actionType: 'single' });
            else if (dTime === sTime) actionTasks.push({ ...t, actionType: 'start' });
            else if (dTime === eTime) actionTasks.push({ ...t, actionType: 'end' });
          });
          return (
            <div key={idx} className="border-b border-r border-slate-200 p-1 flex flex-col relative bg-white">
              <span className={`text-[10px] sm:text-xs font-bold ${dayDate.getDay() === 0 ? 'text-red-400' : 'text-slate-600'} mb-1`}>{dayDate.getDate()}</span>
              <div className="flex flex-col gap-1 overflow-visible">
                {actionTasks.map(t => {
                  let bgColor, textColor, borderColor, prefix;
                  if (t.actionType === 'single') { bgColor = 'bg-emerald-100'; textColor = 'text-emerald-900'; borderColor = 'border-emerald-300'; prefix = ''; } 
                  else if (t.actionType === 'start') { bgColor = 'bg-blue-100'; textColor = 'text-blue-900'; borderColor = 'border-blue-300'; prefix = '▶ INICIO: '; } 
                  else { bgColor = 'bg-amber-100'; textColor = 'text-amber-900'; borderColor = 'border-amber-300'; prefix = '⏹ FIN: '; }
                  const respShort = t.responsible ? t.responsible.split(' ')[0] : 'S/A';
                  return (
                    <div key={`${t.id}-${t.actionType}`} className={`text-[8px] sm:text-[9px] leading-tight px-1 py-0.5 rounded border ${bgColor} ${textColor} ${borderColor} print-color-adjust-exact`} title={`${t.name} (Resp: ${t.responsible})`}>
                      <span className="font-extrabold">{prefix}</span>{t.name} 
                      <span className="block mt-[1px] font-bold opacity-80 border-t border-black/10 pt-[1px]">Resp: {respShort}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskList({ tasks, onEdit, onDelete, onViewCows, onComplete }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
      <div className="overflow-x-auto print-expand">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-4 font-semibold">Actividad</th>
              <th className="p-4 font-semibold">Personal</th>
              <th className="p-4 font-semibold print:hidden">Animales (Aretes)</th>
              <th className="p-4 font-semibold">Fechas</th>
              <th className="p-4 font-semibold">Avance</th>
              <th className="p-4 font-semibold text-right print:hidden">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">No hay tareas que mostrar con los filtros actuales.</td></tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                  <td className="p-4 align-top">
                    <div className="font-medium text-slate-800">{task.name}</div>
                    <div className="text-xs text-slate-500">{task.category || 'Sin categoría'}</div>
                    {task.instructions && (
                      <div className="mt-2 text-[11px] text-slate-600 bg-slate-100 p-2 rounded-md leading-tight max-w-xs border border-slate-200">
                        <span className="font-semibold block mb-0.5">Instrucciones:</span>{task.instructions}
                      </div>
                    )}
                    {task.comments && (
                      <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-md leading-tight max-w-xs">
                        <span className="font-semibold block mb-0.5">Observaciones/Retraso:</span>{task.comments}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <div className="text-sm text-slate-800"><span className="font-semibold text-slate-500">Resp:</span> {task.responsible}</div>
                    {task.supervisor && <div className="text-xs text-slate-600 mt-1"><span className="font-semibold text-slate-400">Sup:</span> {task.supervisor}</div>}
                  </td>
                  <td className="p-4 align-top print:hidden">
                    {task.cows && task.cows.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {task.cows.slice(0, 3).map((cow, i) => <span key={i} className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">{cow}</span>)}
                        {task.cows.length > 3 && <button onClick={() => onViewCows(task)} className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer">+ {task.cows.length - 3} vacas</button>}
                        {task.cows.length <= 3 && task.cows.length > 0 && <button onClick={() => onViewCows(task)} className="text-[10px] text-blue-500 hover:text-blue-700 underline ml-1">Ver lista</button>}
                      </div>
                    ) : (<span className="text-xs text-slate-400 italic">Sin vacas</span>)}
                  </td>
                  <td className="p-4 text-slate-600 align-top text-sm">
                    <div><span className="font-semibold text-slate-400">Inicio:</span> {task.startDate}</div>
                    <div className="mt-1">
                      <span className="font-semibold text-slate-400">Fin:</span> 
                      {task.newEndDate ? (
                        <span className="flex flex-col"><span className="line-through text-slate-400 text-xs">{task.endDate}</span><span className="text-amber-600 font-bold">{task.newEndDate}</span></span>
                      ) : (task.endDate)}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex items-center space-x-2 w-32">
                      <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${task.progress == 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${task.progress}%` }}></div></div>
                      <span className="text-sm font-medium text-slate-700">{task.progress}%</span>
                    </div>
                    {task.quality && (
                      <div className="mt-2"><span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${task.quality === 'bien' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : task.quality === 'regular' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200'}`}>Calificación: {task.quality.toUpperCase()}</span></div>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1 sm:space-x-2 whitespace-nowrap align-top print:hidden">
                    {task.progress < 100 && <button onClick={() => onComplete(task.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors inline-block" title="Marcar completada (100%)"><CheckCircle2 size={18} /></button>}
                    <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-block" title="Editar"><Edit size={18} /></button>
                    <button onClick={() => setDeleteConfirm(task.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors inline-block" title="Eliminar"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-3 text-red-600 mb-4"><AlertCircle size={24} /><h3 className="text-lg font-bold">Confirmar eliminación</h3></div>
            <p className="text-slate-600 mb-6">¿Estás seguro que deseas eliminar esta tarea?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancelar</button>
              <button onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GanttChart({ tasks }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p>No hay datos para generar el diagrama de Gantt con estos filtros.</p>
      </div>
    );
  }

  const DAY_WIDTH = 40;
  const timelineDates = useMemo(() => {
    let minD = parseDate(tasks[0].startDate);
    let maxD = parseDate(tasks[0].newEndDate || tasks[0].endDate);
    tasks.forEach(t => {
      const start = parseDate(t.startDate);
      const end = parseDate(t.newEndDate || t.endDate);
      if (start < minD) minD = start;
      if (end > maxD) maxD = end;
    });
    const startTimeline = addDays(minD, -3);
    const endTimeline = addDays(maxD, 5);
    const totalDays = getDiffDays(startTimeline, endTimeline) + 1;
    const dates = [];
    for (let i = 0; i < totalDays; i++) dates.push(addDays(startTimeline, i));
    return { startTimeline, endTimeline, dates, totalDays };
  }, [tasks]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[500px] print-expand print:border-none print:shadow-none">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0 print:hidden">
        <h3 className="font-semibold text-slate-700">Línea de Tiempo</h3>
        <div className="flex space-x-4 text-xs font-medium text-slate-500">
          <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2 print-color-adjust-exact"></span> En Proceso</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 print-color-adjust-exact"></span> Completado</span>
        </div>
      </div>
      <div className="hidden print:block text-center mb-6 mt-4"><h1 className="text-2xl font-bold text-slate-800">Cronograma de Gantt</h1></div>
      <div className="flex flex-1 overflow-hidden relative print-expand">
        <div className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] print:shadow-none">
          <div className="h-16 border-b border-slate-200 flex items-center px-4 font-semibold text-slate-600 bg-slate-50 shrink-0">Actividad</div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden print-expand" style={{ scrollbarWidth: 'none' }}>
            {tasks.map(task => (
              <div key={task.id} className="h-14 border-b border-slate-100 flex flex-col justify-center px-4 hover:bg-slate-50 group cursor-default print:break-inside-avoid">
                <span className="text-sm font-medium text-slate-800 truncate" title={task.name}>{task.name}</span>
                <span className="text-xs text-slate-500 truncate" title={task.responsible}>{task.responsible}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50/50 print-expand">
          <div style={{ width: `${timelineDates.totalDays * DAY_WIDTH}px` }}>
            <div className="h-16 border-b border-slate-200 flex bg-white relative">
              {timelineDates.dates.map((date, idx) => {
                const isStartOfMonth = date.getDate() === 1 || idx === 0;
                const monthName = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
                return (
                  <div key={idx} className="flex flex-col items-center border-r border-slate-100 shrink-0 relative" style={{ width: `${DAY_WIDTH}px` }}>
                    {isStartOfMonth && <span className="absolute top-1 text-[10px] font-bold text-slate-500 w-full text-center">{monthName}</span>}
                    <span className={`text-xs mt-auto mb-2 ${date.getDay() === 0 ? 'text-red-400 font-bold' : 'text-slate-600'}`}>{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex pointer-events-none">
                {timelineDates.dates.map((date, idx) => (
                  <div key={idx} className={`border-r shrink-0 h-full ${date.getDay() === 0 ? 'border-red-100 bg-red-50/20' : 'border-slate-100'}`} style={{ width: `${DAY_WIDTH}px` }}></div>
                ))}
              </div>
              {tasks.map(task => {
                const taskStart = parseDate(task.startDate);
                const taskEnd = parseDate(task.newEndDate || task.endDate);
                const effectiveEnd = taskEnd < taskStart ? taskStart : taskEnd;
                const leftOffset = getDiffDays(timelineDates.startTimeline, taskStart) * DAY_WIDTH;
                const durationDays = getDiffDays(taskStart, effectiveEnd) + 1;
                const width = durationDays * DAY_WIDTH;
                const progressWidth = (task.progress / 100) * width;
                const isCompleted = task.progress >= 100;

                return (
                  <div key={task.id} className="h-14 border-b border-slate-100/50 relative flex items-center hover:bg-slate-100/50 transition-colors print:break-inside-avoid">
                    <div className={`absolute h-8 rounded-md shadow-sm overflow-hidden flex items-center group cursor-pointer print-color-adjust-exact ${isCompleted ? 'bg-emerald-100' : 'bg-blue-100'} ${task.newEndDate ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`} style={{ left: `${leftOffset}px`, width: `${width}px` }}>
                      <div className={`absolute top-0 left-0 h-full transition-all print-color-adjust-exact ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressWidth}px` }}></div>
                      <span className="relative z-10 text-[10px] sm:text-xs font-semibold text-white px-2 truncate mix-blend-difference drop-shadow-md">{task.progress}%</span>
                      <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 bg-slate-800 text-white text-xs p-3 rounded shadow-lg z-50 whitespace-nowrap print:hidden">
                        <p className="font-bold text-sm mb-1">{task.name}</p>
                        <p className="text-slate-300">Resp: <span className="text-white">{task.responsible}</span></p>
                        {task.instructions && <div className="mt-2 pt-2 border-t border-slate-600 text-slate-300 max-w-[250px] whitespace-normal"><span className="font-semibold block text-emerald-200">Instrucciones:</span> {task.instructions}</div>}
                        <p className="mt-2 pt-2 border-t border-slate-600">Avance: <span className="font-bold">{task.progress}%</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskFormModal({ task, existingTasks, onSave, onClose }) {
  const [formData, setFormData] = useState(
    task || { name: '', responsible: '', supervisor: '', startDate: formatDate(new Date()), endDate: formatDate(addDays(new Date(), 1)), newEndDate: '', progress: 0, category: 'Manejo General', cows: [], comments: '', quality: '', instructions: '' }
  );
  const [cowsInput, setCowsInput] = useState(task && task.cows ? task.cows.join(', ') : '');
  const [error, setError] = useState('');
  const [isRepetitive, setIsRepetitive] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [repeatUntil, setRepeatUntil] = useState('');

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.responsible || !formData.supervisor) return setError('Faltan campos obligatorios.');
    const effectiveEndDate = formData.newEndDate ? formData.newEndDate : formData.endDate;
    if (new Date(effectiveEndDate) < new Date(formData.startDate)) return setError('La fecha de fin no puede ser anterior al inicio.');
    const parsedCows = cowsInput.split(/[\s,]+/).map(cow => cow.trim()).filter(cow => cow.length > 0);
    const baseTaskData = { ...formData, progress: Number(formData.progress), cows: parsedCows };

    if (isRepetitive && !task) {
      if (!repeatUntil) return setError('Falta seleccionar la fecha límite de repetición.');
      const startD = parseDate(formData.startDate);
      const limitD = parseDate(repeatUntil);
      const durationDays = getDiffDays(startD, parseDate(formData.endDate));
      if (limitD < startD) return setError('Fecha límite inválida.');

      let currentStart = new Date(startD);
      const generatedTasks = [];
      let index = 0;
      while (currentStart <= limitD) {
        const currentEnd = addDays(currentStart, durationDays);
        generatedTasks.push({ ...baseTaskData, startDate: formatDate(currentStart), endDate: formatDate(currentEnd), id: Date.now().toString() + '-' + index });
        if (frequency === 'daily') currentStart = addDays(currentStart, 1);
        else if (frequency === 'weekly') currentStart = addDays(currentStart, 7);
        else if (frequency === 'biweekly') currentStart = addDays(currentStart, 14);
        else if (frequency === 'monthly') currentStart.setMonth(currentStart.getMonth() + 1);
        index++;
        if (index > 365) break; 
      }
      onSave(generatedTasks);
    } else { onSave(baseTaskData); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{task ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 hover:bg-slate-200 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}
          <form id="taskForm" onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Actividad *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" /></div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-slate-700">Lista de Vacas</label>
                {existingTasks && existingTasks.length > 0 && (
                  <select className="text-xs border border-slate-300 rounded-md text-slate-600 px-2 py-1 focus:ring-emerald-50 outline-none bg-slate-50 cursor-pointer" onChange={(e) => { if(e.target.value) { const t = existingTasks.find(t => t.id.toString() === e.target.value); if(t && t.cows) setCowsInput(t.cows.join(', ')); } e.target.value = ""; }}>
                    <option value="">Copiar de otra tarea...</option>
                    {existingTasks.filter(t => t.cows && t.cows.length > 0 && t.id !== task?.id).map(t => <option key={t.id} value={t.id}>{t.name} ({t.cows.length})</option>)}
                  </select>
                )}
              </div>
              <textarea name="cowsText" value={cowsInput} onChange={(e) => setCowsInput(e.target.value)} rows="2" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm" ></textarea>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Responsable *</label><input type="text" name="responsible" value={formData.responsible || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Supervisor *</label><input type="text" name="supervisor" value={formData.supervisor || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio *</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Fecha Esperada de Fin *</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-1">Instrucciones de Tarea</label>
              <textarea name="instructions" value={formData.instructions || ''} onChange={handleChange} rows="2" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" ></textarea>
            </div>
            {!task && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <label className="flex items-center space-x-2 text-sm font-medium text-blue-900 cursor-pointer">
                  <input type="checkbox" checked={isRepetitive} onChange={(e) => setIsRepetitive(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" /><span>🔄 Registrar como repetitiva</span>
                </label>
                {isRepetitive && (
                  <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-sm text-blue-800 mb-1">Frecuencia:</label><select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full border border-blue-300 rounded-lg px-4 py-2 outline-none bg-white"><option value="daily">Diaria</option><option value="weekly">Semanal</option><option value="biweekly">Quincenal</option><option value="monthly">Mensual</option></select></div>
                    <div><label className="block text-sm text-blue-800 mb-1">Hasta:</label><input type="date" value={repeatUntil} onChange={(e) => setRepeatUntil(e.target.value)} min={formData.startDate} className="w-full border border-blue-300 rounded-lg px-4 py-2 outline-none bg-white" /></div>
                  </div>
                )}
              </div>
            )}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between"><label className="text-sm font-medium text-slate-700 mb-1">Avance</label><span className="text-sm font-bold text-emerald-600">{formData.progress}%</span></div>
              <input type="range" name="progress" min="0" max="100" step="5" value={formData.progress} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
            </div>
          </form>
        </div>
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200">Cancelar</button>
          <button type="submit" form="taskForm" className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm">{task ? 'Guardar Cambios' : 'Crear Actividad'}</button>
        </div>
      </div>
    </div>
  );
}

function CowsListModal({ task, onClose }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(task.cows.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div><h2 className="text-xl font-bold text-slate-800">Lista de Animales</h2><p className="text-sm text-slate-500">{task.name}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-2 hover:bg-slate-200"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold text-sm">Total: {task.cows.length} vacas</span>
            <button onClick={handleCopy} className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium border ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-600 border-slate-300'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}<span>{copied ? '¡Copiado!' : 'Copiar lista'}</span>
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {task.cows.map((c, i) => <div key={i} className="bg-slate-50 border border-slate-100 rounded text-center py-2 text-sm font-mono font-semibold text-slate-700">{c}</div>)}
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end"><button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900">Cerrar</button></div>
      </div>
    </div>
  );
}