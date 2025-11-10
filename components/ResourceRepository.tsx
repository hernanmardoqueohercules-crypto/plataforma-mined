import React, { useState } from 'react';
import { Resource, ResourceType, User, Breadcrumb } from '../types';
import ResourceModal from './ResourceModal';

interface ResourceRepositoryProps {
  resources: Resource[];
  allResourcesForView: Resource[];
  user: User;
  onProtectedAction: () => void;
  onSave: (saveData: { resourceData: Omit<Resource, 'id' | 'modified' | 'modifiedBy'> & { id?: number } }) => void;
  onDelete: (resourceId: number) => void;
  canAddResources: boolean;
  onFileUpload: (file: File) => Promise<string>;
  isDriveAuthorized: boolean;
  breadcrumbs: Breadcrumb[];
  onFolderClick: (folderId: number) => void;
  onBreadcrumbClick: (folderId: number | null) => void;
  currentFolderId: number | null;
}

const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DocIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const XlsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>


const getIconForType = (type: ResourceType) => {
    switch (type) {
        case 'Carpeta': return <FolderIcon />;
        case 'PDF': return <PdfIcon />;
        case 'Documento': return <DocIcon />;
        case 'Hoja de cálculo': return <XlsIcon />;
        case 'Enlace': return <LinkIcon />;
        default: return <DocIcon />;
    }
};

const ResourceRepository: React.FC<ResourceRepositoryProps> = ({ resources, allResourcesForView, user, onProtectedAction, onSave, onDelete, canAddResources, onFileUpload, isDriveAuthorized, breadcrumbs, onFolderClick, onBreadcrumbClick, currentFolderId }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const availableFolders = allResourcesForView.filter(r => r.type === 'Carpeta');

  const handleRowClick = (resource: Resource) => {
    if (resource.type === 'Carpeta') {
      onFolderClick(resource.id);
      return;
    }
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (resource.isProtected && !user) {
      onProtectedAction();
    } else {
      alert(`Este recurso no tiene una URL externa. Accediendo a: ${resource.name}`);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setModalOpen(true);
  };
  
  const handleDelete = (resourceId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
        onDelete(resourceId);
    }
  };

  const handleSaveResource = (data: Omit<Resource, 'id' | 'modified' | 'modifiedBy'>) => {
    onSave({ resourceData: { ...data, id: editingResource?.id } });
    setModalOpen(false);
    setEditingResource(null);
  };

  const openAddModal = () => {
    setEditingResource(null);
    setModalOpen(true);
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.id || 'home'} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                )}
                <button
                  onClick={() => onBreadcrumbClick(crumb.id)}
                  className={`text-sm font-medium ${index === breadcrumbs.length - 1 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                  disabled={index === breadcrumbs.length - 1}
                >
                  {crumb.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {canAddResources && (
            <button
                onClick={openAddModal}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
            >
                <PlusIcon/>
                Subir Recurso
            </button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Última Modificación
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Modificado por
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {resources.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Esta carpeta está vacía.
                  </td>
                </tr>
              )}
              {resources.map((resource) => (
                <tr 
                  key={resource.id} 
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(resource)}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 mr-3">{getIconForType(resource.type)}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{resource.name}</div>
                      {resource.isProtected && !resource.url && <LockIcon />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(resource)}>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{resource.modified}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(resource)}>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{resource.modifiedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      {canAddResources && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(resource); }} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors duration-200" title="Editar">
                            <EditIcon/>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(resource.id); }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200" title="Eliminar">
                            <DeleteIcon/>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <ResourceModal
            isOpen={isModalOpen}
            onClose={() => { setModalOpen(false); setEditingResource(null); }}
            onSave={handleSaveResource}
            resource={editingResource}
            onFileUpload={onFileUpload}
            isDriveAuthorized={isDriveAuthorized}
            availableFolders={availableFolders}
            currentFolderId={currentFolderId}
        />
      )}
    </>
  );
};

export default ResourceRepository;