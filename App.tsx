import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Monitoreo from './pages/Monitoreo';
import Supervision from './pages/Supervision';
import CentrosEscolares from './pages/CentrosEscolares';
import LoginModal from './pages/LoginModal';
import AuthorizationLoader from './components/AuthorizationLoader';
import SettingsModal from './components/SettingsModal';
import { View, User, Theme, Resource, Breadcrumb } from './types';

// Declara el objeto 'google' y 'gapi' en el scope global para TypeScript
declare global {
  interface Window {
    google: any;
    gapi: any;
    tokenClient: any;
  }
}

// Initial data moved here for central management
const initialMonitoreoResources: Resource[] = [
    { id: 1, name: 'Reportes de Sistema', type: 'Carpeta', modified: '2024-07-28 10:00', modifiedBy: 'Admin', parentId: null },
    { id: 2, name: 'Log de Actividad Q2.pdf', type: 'PDF', modified: '2024-07-27 15:30', modifiedBy: 'Sistema', isProtected: true, parentId: null },
    { id: 3, name: 'Análisis de Uptime.xlsx', type: 'Hoja de cálculo', modified: '2024-07-27 09:15', modifiedBy: 'Ana Pérez', parentId: null },
    { id: 4, name: 'Protocolos de Seguridad.docx', type: 'Documento', modified: '2024-07-25 12:00', modifiedBy: 'Carlos Gómez', isProtected: true, parentId: 1 },
    { id: 5, name: 'Alertas Críticas Resueltas', type: 'Carpeta', modified: '2024-07-24 18:45', modifiedBy: 'Admin', isProtected: true, parentId: null },
    { id: 6, name: 'Métricas de Performance.xlsx', type: 'Hoja de cálculo', modified: '2024-07-23 11:00', modifiedBy: 'Ana Pérez', parentId: 5 },
];

const initialSupervisionResources: Resource[] = [
    { id: 1, name: 'Auditorías', type: 'Carpeta', modified: '2024-07-28 11:20', modifiedBy: 'Laura Martínez', isProtected: true, parentId: null },
    { id: 2, name: 'Checklist de Revisión v3.pdf', type: 'PDF', modified: '2024-07-26 14:00', modifiedBy: 'Javier Solís', parentId: 1 },
    { id: 3, name: 'Plan de Trabajo Semanal (Online)', type: 'Enlace', url: 'https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j', modified: '2024-07-29 10:00', modifiedBy: 'Laura Martínez', parentId: null },
    { id: 4, name: 'Plantillas de Reportes', type: 'Carpeta', modified: '2024-07-24 08:30', modifiedBy: 'Admin', parentId: null },
    { id: 5, name: 'Guía de Buenas Prácticas.docx', type: 'Documento', modified: '2024-07-22 19:05', modifiedBy: 'Javier Solís', parentId: 4 },
];

const initialCentrosResources: Resource[] = [
    { id: 1, name: 'Documentación Oficial', type: 'Carpeta', modified: '2024-07-29 09:00', modifiedBy: 'Sofía Castro', parentId: null },
    { id: 2, name: 'Calendario Escolar 2024-2025.pdf', type: 'PDF', modified: '2024-07-28 13:45', modifiedBy: 'Admin', parentId: null },
    { id: 3, name: 'Matrícula Estudiantil General.xlsx', type: 'Hoja de cálculo', modified: '2024-07-27 11:10', modifiedBy: 'Roberto Díaz', isProtected: true, parentId: null },
    { id: 4, name: 'Directorio de Personal Docente.docx', type: 'Documento', modified: '2024-07-26 17:00', modifiedBy: 'Sofía Castro', isProtected: true, parentId: null },
    { id: 5, name: 'Asignación de Recursos', type: 'Carpeta', modified: '2024-07-25 10:00', modifiedBy: 'Admin', parentId: null },
    { id: 6, name: 'Formularios de Inscripción.pdf', type: 'PDF', modified: '2024-07-24 15:20', modifiedBy: 'Roberto Díaz', parentId: 1 },
];


const loadResourcesFromStorage = (key: string, initialData: Resource[]): Resource[] => {
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) return JSON.parse(storedData);
    } catch (error) {
        console.error(`Error parsing resources from localStorage for key "${key}":`, error);
    }
    return initialData;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User>(null);
  const [activeView, setActiveView] = useState<View>('centros-escolares');
  const [isLoginModalVisible, setLoginModalVisible] = useState(false);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('theme') as Theme) || 'light');
  const [postLoginRedirectView, setPostLoginRedirectView] = useState<View | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [gcsBucketName, setGcsBucketName] = useState<string | null>(() => localStorage.getItem('gcs_bucket_name'));


  const [monitoreoResources, setMonitoreoResources] = useState<Resource[]>(() => loadResourcesFromStorage('monitoreo_resources', initialMonitoreoResources));
  const [supervisionResources, setSupervisionResources] = useState<Resource[]>(() => loadResourcesFromStorage('supervision_resources', initialSupervisionResources));
  const [centrosResources, setCentrosResources] = useState<Resource[]>(() => loadResourcesFromStorage('centros_resources', initialCentrosResources));
  
  const [currentFolderIds, setCurrentFolderIds] = useState<{[key in View]: number | null}>({
    'monitoreo': null,
    'supervision': null,
    'centros-escolares': null,
  });

  const [breadcrumbs, setBreadcrumbs] = useState<{[key in View]: Breadcrumb[]}>({
    'monitoreo': [{ id: null, name: 'Inicio' }],
    'supervision': [{ id: null, name: 'Inicio' }],
    'centros-escolares': [{ id: null, name: 'Inicio' }],
  });

  const [gapiReady, setGapiReady] = useState(false);
  const [storageAuthorized, setStorageAuthorized] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load GAPI script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', () => {
        setGapiReady(true);
      });
    };
    document.body.appendChild(script);
  }, []);

  // Initialize GAPI client and request Storage scope
  const initializeGapiClient = useCallback(async () => {
    if (!gapiReady) return;
    try {
      return new Promise<void>((resolve, reject) => {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/devstorage.read_write',
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                setAccessToken(tokenResponse.access_token);
                setStorageAuthorized(true);
                resolve();
              } else {
                reject(new Error("La respuesta del token de Google no fue válida."));
              }
            },
            error_callback: (error: any) => {
                console.error('Error de autorización de Google:', error);
                reject(new Error("La autorización de Google Cloud Storage falló. Por favor, intenta de nuevo."));
            }
        });
        
        window.tokenClient.requestAccessToken({ prompt: '' });
      });

    } catch (error) {
      console.error('Error al inicializar el cliente GAPI:', error);
    }
  }, [gapiReady]);
  

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => { localStorage.setItem('monitoreo_resources', JSON.stringify(monitoreoResources)); }, [monitoreoResources]);
  useEffect(() => { localStorage.setItem('supervision_resources', JSON.stringify(supervisionResources)); }, [supervisionResources]);
  useEffect(() => { localStorage.setItem('centros_resources', JSON.stringify(centrosResources)); }, [centrosResources]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleLogin = async (googleUser: { name: string; email: string; picture: string; }) => {
    setUser(googleUser);
    setLoginModalVisible(false);
    setIsAuthorizing(true);
    try {
      await initializeGapiClient();
    } catch (error) {
      console.error("La autorización de Cloud Storage falló:", error);
      alert(error instanceof Error ? error.message : "Ocurrió un error inesperado durante la autorización.");
      handleLogout(); // Log out user if authorization fails
    } finally {
        setIsAuthorizing(false);
    }
    
    if (postLoginRedirectView) {
      setActiveView(postLoginRedirectView);
      setPostLoginRedirectView(null);
    }
  };

  const handleLogout = () => {
    if (window.google) window.google.accounts.id.disableAutoSelect();
    setUser(null);
    setStorageAuthorized(false);
    setAccessToken(null);
    if (activeView === 'monitoreo' || activeView === 'supervision') {
      setActiveView('centros-escolares');
    }
  };
  
  const showLoginModal = () => setLoginModalVisible(true);
  
  const handleViewChange = (view: View) => {
    if ((view === 'monitoreo' || view === 'supervision') && !user) {
      setPostLoginRedirectView(view);
      showLoginModal();
    } else {
      setActiveView(view);
    }
    setSidebarOpen(false);
  };

   const handleFileUpload = useCallback(async (file: File): Promise<string> => {
        if (!storageAuthorized || !accessToken) {
            throw new Error("La autorización de Google Cloud Storage es requerida.");
        }
        
        const bucketName = gcsBucketName;
        if (!bucketName) {
            throw new Error("El nombre del bucket de Google Cloud Storage no está configurado. Ve a Ajustes (en el menú de tu perfil) para añadirlo.");
        }
        
        // Sanitize file name to be URL-safe
        const fileName = encodeURIComponent(file.name);
        const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${fileName}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error al subir a GCS:', error);
            throw new Error(`Error al subir el archivo: ${error.error.message}`);
        }

        // Return the public URL of the uploaded file
        return `https://storage.googleapis.com/${bucketName}/${fileName}`;
    }, [storageAuthorized, accessToken, gcsBucketName]);
  
  const handleSaveResource = (saveData: { resourceData: Omit<Resource, 'id' | 'modified' | 'modifiedBy'> & { id?: number } }) => {
    const { resourceData } = saveData;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const modifiedBy = user?.name || 'Usuario';

    const viewToUpdate = activeView;

    if (resourceData.id) {
      const updater = (resources: Resource[]) => resources.map(r => r.id === resourceData.id ? { ...r, ...resourceData, modified: formattedDate, modifiedBy } : r);
      switch(viewToUpdate) {
        case 'monitoreo': setMonitoreoResources(updater); break;
        case 'supervision': setSupervisionResources(updater); break;
        case 'centros-escolares': setCentrosResources(updater); break;
      }
    } else {
      const newResource: Resource = {
        id: Date.now(),
        ...(resourceData as Omit<Resource, 'id' | 'modified' | 'modifiedBy'>),
        modified: formattedDate,
        modifiedBy,
      };

      switch(viewToUpdate) {
        case 'monitoreo': setMonitoreoResources(prev => [...prev, newResource]); break;
        case 'supervision': setSupervisionResources(prev => [...prev, newResource]); break;
        case 'centros-escolares': setCentrosResources(prev => [...prev, newResource]); break;
      }
    }
  };

  const handleDeleteResource = (resourceId: number) => {
      const filterer = (resources: Resource[]) => resources.filter(r => r.id !== resourceId);
       switch(activeView) {
        case 'monitoreo': setMonitoreoResources(filterer); break;
        case 'supervision': setSupervisionResources(filterer); break;
        case 'centros-escolares': setCentrosResources(filterer); break;
      }
  };

  const handleNavigateToFolder = (folderId: number | null) => {
      const getResourceList = (): Resource[] => {
        switch (activeView) {
          case 'monitoreo': return monitoreoResources;
          case 'supervision': return supervisionResources;
          case 'centros-escolares': return centrosResources;
          default: return [];
        }
      };

      const buildBreadcrumbs = (id: number | null): Breadcrumb[] => {
        if (id === null) return [{ id: null, name: 'Inicio' }];
        
        const allResources = getResourceList();
        const trail: Breadcrumb[] = [];
        let currentId: number | null = id;

        while (currentId !== null) {
          const folder = allResources.find(r => r.id === currentId);
          if (folder) {
            trail.unshift({ id: folder.id, name: folder.name });
            currentId = folder.parentId;
          } else {
            currentId = null;
          }
        }
        return [{ id: null, name: 'Inicio' }, ...trail];
      };

      setCurrentFolderIds(prev => ({ ...prev, [activeView]: folderId }));
      setBreadcrumbs(prev => ({ ...prev, [activeView]: buildBreadcrumbs(folderId) }));
  };

  const handleSaveBucketName = (bucketName: string) => {
    localStorage.setItem('gcs_bucket_name', bucketName);
    setGcsBucketName(bucketName);
  };


  const renderContent = () => {
    const getActiveResources = () => {
      switch (activeView) {
        case 'monitoreo': return monitoreoResources;
        case 'supervision': return supervisionResources;
        case 'centros-escolares': return centrosResources;
        default: return [];
      }
    };
    
    const allResourcesForView = getActiveResources();
    const currentFolderId = currentFolderIds[activeView];
    const filteredResources = allResourcesForView.filter(r => r.parentId === currentFolderId);
    
    const commonProps = { 
      user, 
      onProtectedAction: showLoginModal,
      onSave: handleSaveResource,
      onDelete: handleDeleteResource,
      onFileUpload: handleFileUpload,
      isDriveAuthorized: storageAuthorized,
      resources: filteredResources,
      allResourcesForView,
      breadcrumbs: breadcrumbs[activeView],
      onFolderClick: (folderId: number) => handleNavigateToFolder(folderId),
      onBreadcrumbClick: (folderId: number | null) => handleNavigateToFolder(folderId),
      currentFolderId: currentFolderId,
    };

    switch (activeView) {
      case 'monitoreo':
        return <Monitoreo {...commonProps} canAddResources={!!user} />;
      case 'supervision':
        return <Supervision {...commonProps} canAddResources={!!user} />;
      case 'centros-escolares':
        return <CentrosEscolares {...commonProps} canAddResources={!!user} />;
      default:
        return <CentrosEscolares {...commonProps} canAddResources={!!user} />;
    }
  };
  
  const getPageTitle = () => {
    const baseTitles: { [key in View]: string } = {
      'monitoreo': 'Recursos de Monitoreo',
      'supervision': 'Recursos de Supervisión',
      'centros-escolares': 'Recursos de Centros Escolares'
    };
    const activeBreadcrumbs = breadcrumbs[activeView];
    const currentFolderName = activeBreadcrumbs[activeBreadcrumbs.length - 1].name;
    
    return currentFolderName === 'Inicio' ? baseTitles[activeView] : currentFolderName;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {isLoginModalVisible && <LoginModal onLogin={handleLogin} onClose={() => setLoginModalVisible(false)} />}
      {isAuthorizing && <AuthorizationLoader text="Autorizando acceso a Google Cloud..." />}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveBucketName}
        currentBucketName={gcsBucketName}
      />
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={toggleSidebar}></div>}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getPageTitle()} 
          user={user} 
          onLogout={handleLogout} 
          onLoginClick={showLoginModal}
          theme={theme}
          toggleTheme={toggleTheme}
          onMenuClick={toggleSidebar}
          onSettingsClick={() => setSettingsModalOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
