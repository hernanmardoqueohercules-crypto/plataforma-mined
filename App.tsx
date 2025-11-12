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

declare global {
  interface Window {
    google: any;
    gapi: any;
    tokenClient: any;
  }
}

// ID de la carpeta principal en Google Drive (carpeta pública)
const MAIN_DRIVE_FOLDER_ID = '1YBJiaHTov4yyxUqbXKZNFsKmhOj_6ys6';

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
  const [driveFolderId, setDriveFolderId] = useState<string>(MAIN_DRIVE_FOLDER_ID);

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
  const [driveAuthorized, setDriveAuthorized] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Mapeo de carpetas de Drive por sección
  const [sectionFolderIds, setSectionFolderIds] = useState<{[key in View]?: string}>({});

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

  // Función para obtener o crear carpeta de sección en Drive
  const getOrCreateSectionFolder = useCallback(async (sectionName: string, parentFolderId: string, token: string): Promise<string> => {
    try {
      // Buscar si ya existe la carpeta
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${sectionName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const searchData = await searchResponse.json();
      
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Si no existe, crear la carpeta
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sectionName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId]
        }),
      });

      const createData = await createResponse.json();
      return createData.id;
    } catch (error) {
      console.error('Error al obtener/crear carpeta de sección:', error);
      throw error;
    }
  }, []);

  // Initialize GAPI client and request Drive scope
  const initializeGapiClient = useCallback(async () => {
    if (!gapiReady) return;
    
    // Verificar si window.google está disponible
    if (!window.google?.accounts?.oauth2) {
      throw new Error("Google OAuth no está disponible. Por favor, recarga la página.");
    }
    
    try {
      return new Promise<void>((resolve, reject) => {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            callback: async (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                console.log('✅ Token de acceso obtenido');
                setAccessToken(tokenResponse.access_token);
                setDriveAuthorized(true);
                
                // Crear carpetas de sección
                try {
                  console.log('📁 Creando carpetas de sección...');
                  const monitoreoFolderId = await getOrCreateSectionFolder('Monitoreo', MAIN_DRIVE_FOLDER_ID, tokenResponse.access_token);
                  const supervisionFolderId = await getOrCreateSectionFolder('Supervisión', MAIN_DRIVE_FOLDER_ID, tokenResponse.access_token);
                  const centrosFolderId = await getOrCreateSectionFolder('Centros Escolares', MAIN_DRIVE_FOLDER_ID, tokenResponse.access_token);
                  
                  setSectionFolderIds({
                    'monitoreo': monitoreoFolderId,
                    'supervision': supervisionFolderId,
                    'centros-escolares': centrosFolderId,
                  });
                  console.log('✅ Carpetas creadas exitosamente');
                } catch (error) {
                  console.error('❌ Error al crear carpetas de sección:', error);
                  alert('Las carpetas se crearon pero hubo un problema. Los archivos se subirán a la carpeta principal.');
                }
                
                resolve();
              } else if (tokenResponse && tokenResponse.error) {
                // Usuario canceló o hubo un error específico
                console.error('❌ Error en tokenResponse:', tokenResponse.error);
                reject(new Error(`Error de autorización: ${tokenResponse.error}`));
              } else {
                reject(new Error("La respuesta del token de Google no fue válida."));
              }
            },
            error_callback: (error: any) => {
                console.error('❌ Error de autorización de Google:', error);
                let errorMessage = "La autorización de Google Drive falló.";
                
                if (error.type === 'popup_closed') {
                  errorMessage = "La ventana de autorización se cerró. Por favor, intenta de nuevo y permite pop-ups.";
                } else if (error.type === 'popup_failed_to_open') {
                  errorMessage = "No se pudo abrir la ventana de autorización. Por favor, permite pop-ups en tu navegador.";
                }
                
                reject(new Error(errorMessage));
            }
        });
        
        // Solicitar el token con prompt para forzar la selección de cuenta
        try {
          window.tokenClient.requestAccessToken({ 
            prompt: 'consent', // Forzar pantalla de consentimiento
            hint: user?.email || '' // Sugerir el email del usuario logueado
          });
        } catch (error) {
          console.error('❌ Error al solicitar token:', error);
          reject(new Error("No se pudo iniciar el proceso de autorización. Verifica que los pop-ups estén permitidos."));
        }
      });

    } catch (error) {
      console.error('❌ Error al inicializar el cliente GAPI:', error);
      throw error;
    }
  }, [gapiReady, getOrCreateSectionFolder, user]);
  
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
      console.error("La autorización de Drive falló:", error);
      alert(error instanceof Error ? error.message : "Ocurrió un error inesperado durante la autorización.");
      handleLogout();
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
    setDriveAuthorized(false);
    setAccessToken(null);
    setSectionFolderIds({});
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
    if (!driveAuthorized || !accessToken) {
        throw new Error("La autorización de Google Drive es requerida.");
    }
    
    // Obtener la carpeta de sección correspondiente
    const sectionFolderId = sectionFolderIds[activeView];
    if (!sectionFolderId) {
        throw new Error("No se pudo determinar la carpeta de destino.");
    }
    
    const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [sectionFolderId] // Usar la carpeta de la sección actual
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Error al subir a Drive:', error);
        throw new Error(`Error al subir el archivo: ${error.error?.message || 'Error desconocido'}`);
    }

    const result = await response.json();
    return result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`;
  }, [driveAuthorized, accessToken, sectionFolderIds, activeView]);
  
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

  const handleSaveFolderId = (folderId: string) => {
    // Esta función ya no es necesaria ya que usamos una carpeta fija
    // pero la mantenemos para compatibilidad
    console.log('Configuración de carpeta personalizada deshabilitada. Usando carpeta principal:', MAIN_DRIVE_FOLDER_ID);
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
      isDriveAuthorized: driveAuthorized,
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
      {isAuthorizing && <AuthorizationLoader text="Autorizando acceso a Google Drive..." />}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveFolderId}
        currentFolderId={driveFolderId}
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