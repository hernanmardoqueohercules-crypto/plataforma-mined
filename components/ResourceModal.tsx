import React, { useState, useEffect } from 'react';
import { Resource, ResourceType } from '../types';

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Resource, 'id' | 'modified' | 'modifiedBy'>) => void;
    resource: Resource | null;
    onFileUpload: (file: File) => Promise<string>;
    isDriveAuthorized: boolean;
    availableFolders: Resource[];
    currentFolderId: number | null;
}

const resourceTypes: ResourceType[] = ['Carpeta', 'PDF', 'Documento', 'Hoja de cálculo', 'Enlace'];

const UploadIcon = () => (
    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ResourceModal: React.FC<ResourceModalProps> = ({ isOpen, onClose, onSave, resource, onFileUpload, isDriveAuthorized, availableFolders, currentFolderId }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<ResourceType>('Documento');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isProtected, setIsProtected] = useState(false);
    const [parentId, setParentId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (resource) {
            setName(resource.name);
            setType(resource.type);
            setIsProtected(resource.isProtected || false);
            setUrl(resource.url || '');
            setParentId(resource.parentId);
            setFile(null);
        } else {
            // Reset for new resource
            setName('');
            setType('Documento');
            setIsProtected(false);
            setUrl('');
            setFile(null);
            setParentId(currentFolderId); // Default to current folder
        }
        setError('');
        setIsUploading(false);
    }, [resource, isOpen, currentFolderId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!name) {
                setName(selectedFile.name);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('El nombre del recurso no puede estar vacío.');
            return;
        }
        if (type === 'Enlace' && !url.trim()) {
            setError('La URL no puede estar vacía para el tipo Enlace.');
            return;
        }
        if (['PDF', 'Documento', 'Hoja de cálculo'].includes(type) && !file && !resource?.url) {
             setError('Debe seleccionar un archivo para este tipo de recurso.');
             return;
        }
        
        setIsUploading(true);
        let finalUrl: string | undefined = undefined;

        if (type === 'Enlace') {
            finalUrl = url;
        } else if (file) {
            if (!isDriveAuthorized) {
                 setError('Por favor, autoriza el acceso a Google Drive para subir archivos.');
                 setIsUploading(false);
                 return;
            }
            try {
                finalUrl = await onFileUpload(file);
            } catch (uploadError: any) {
                console.error("Error uploading file to GCS:", uploadError);
                setError(`Error al subir archivo: ${uploadError.message || 'Inténtalo de nuevo.'}`);
                setIsUploading(false);
                return;
            }
        } else {
            finalUrl = resource?.url;
        }
        
        onSave({ 
            name, 
            type, 
            isProtected, 
            url: finalUrl,
            parentId
        });
        setIsUploading(false);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {resource ? 'Editar Recurso' : 'Nuevo Recurso'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!resource && (
                         <div>
                            <label htmlFor="resource-parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Carpeta de Destino</label>
                            <select
                                id="resource-parent"
                                value={parentId === null ? 'root' : parentId}
                                onChange={(e) => setParentId(e.target.value === 'root' ? null : Number(e.target.value))}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 dark:text-gray-100"
                            >
                                <option value="root">Inicio (Carpeta Raíz)</option>
                                {availableFolders.map(folder => (
                                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <hr className="dark:border-gray-600"/>

                    <div>
                        <label htmlFor="resource-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                        <input
                            type="text"
                            id="resource-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                            placeholder="Ej: Reporte Trimestral.pdf"
                        />
                         {error && error.includes('nombre') && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>

                    <div>
                        <label htmlFor="resource-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                        <select
                            id="resource-type"
                            value={type}
                            onChange={(e) => { setType(e.target.value as ResourceType); setError(''); }}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 dark:text-gray-100"
                        >
                            {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                     {['PDF', 'Documento', 'Hoja de cálculo'].includes(type) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Archivo</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <UploadIcon />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            <span>Seleccionar un archivo</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">o arrástralo aquí</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {file ? file.name : (resource?.url ? 'Archivo cargado previamente' : 'Ningún archivo seleccionado')}
                                    </p>
                                </div>
                            </div>
                            {error && (error.includes('archivo') || error.includes('subir')) && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                    )}
                    
                    {type === 'Enlace' && (
                        <div>
                            <label htmlFor="resource-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                            <input
                                type="url"
                                id="resource-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                                placeholder="https://docs.google.com/..."
                            />
                            {error && error.includes('URL') && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                    )}
                    
                    <div className="flex items-center">
                         <input
                            id="is-protected"
                            type="checkbox"
                            checked={isProtected}
                            onChange={(e) => setIsProtected(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is-protected" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                           Recurso Protegido (requiere iniciar sesión)
                        </label>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {isUploading && <SpinnerIcon />}
                            {isUploading ? 'Subiendo...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResourceModal;
