import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bucketName: string) => void;
    currentBucketName: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentBucketName }) => {
    const [bucketName, setBucketName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setBucketName(currentBucketName || '');
            setError('');
        }
    }, [isOpen, currentBucketName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bucketName.trim()) {
            setError('El nombre del bucket no puede estar vacío.');
            return;
        }
        onSave(bucketName.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Ajustes de Almacenamiento
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="bucket-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Bucket de Google Cloud Storage</label>
                        <input
                            type="text"
                            id="bucket-name"
                            value={bucketName}
                            onChange={(e) => setBucketName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                            placeholder="mi-bucket-de-almacenamiento"
                        />
                         {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                         <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Este es el nombre único de tu bucket en Google Cloud Storage donde se guardarán los archivos.
                         </p>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
