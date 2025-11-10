import React from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { User } from '../types';

interface LoginModalProps {
    onLogin: (user: { name: string; email: string; picture: string; }) => void;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="flex justify-center">
                    <img src="https://www.mined.gob.sv/wp-content/uploads/2021/logo_mined.png" alt="Logo MINED" className="h-14" />
                </div>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Acceso Requerido</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Por favor, inicia sesión para acceder a este recurso.
                </p>
                <div>
                    <GoogleSignInButton onLoginSuccess={onLogin} />
                </div>
            </div>
        </div>
    );
};

export default LoginModal;