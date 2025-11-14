import React, { useState, useRef, useEffect } from 'react';
import { User, Theme, Notification } from '../types';

interface HeaderProps {
    title: string;
    user: User;
    onLogout: () => void;
    onLoginClick: () => void;
    theme: Theme;
    toggleTheme: () => void;
    onMenuClick: () => void;
    onSettingsClick: () => void;
    notifications: Notification[];
    onNotificationClick: () => void;
    onMarkAllRead: () => void;
    showNotifications: boolean;
    driveAccountEmail: string | null;
    driveFolderId: string;
}

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const DriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 87.3 78" fill="none">
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
);

const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
};

const Header: React.FC<HeaderProps> = ({ 
    title, 
    user, 
    onLogout, 
    onLoginClick, 
    theme, 
    toggleTheme, 
    onMenuClick, 
    onSettingsClick,
    notifications,
    onNotificationClick,
    onMarkAllRead,
    showNotifications,
    driveAccountEmail,
    driveFolderId
}) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                if (showNotifications) onNotificationClick();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications, onNotificationClick]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const shortFolderId = driveFolderId.substring(0, 8) + '...';

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 shadow-md flex-shrink-0">
            <div className="flex items-center">
                 <button 
                    onClick={onMenuClick} 
                    className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden mr-4"
                    aria-label="Open sidebar"
                >
                    <MenuIcon />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full focus:outline-none transition-colors duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-gray-700"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={onNotificationClick}
                        className="relative p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
                    >
                        {unreadCount > 0 && (
                            <>
                                <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
                                <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
                            </>
                        )}
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20 max-h-96 overflow-y-auto">
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                                </h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={onMarkAllRead}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Marcar todas
                                    </button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No hay notificaciones
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${!notification.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-200">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatTimestamp(notification.timestamp)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {user && driveAccountEmail ? (
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 focus:outline-none bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <DriveIcon />
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Carpeta de Drive</span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{driveAccountEmail}</span>
                            </div>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20">
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">Información de Almacenamiento</p>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <DriveIcon />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Google Drive</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        <strong>Cuenta:</strong> {driveAccountEmail}
                                    </p>
                                    <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                                        <FolderIcon />
                                        <span><strong>ID:</strong> {shortFolderId}</span>
                                    </div>
                                </div>
                                <a 
                                    href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-500 hover:text-white"
                                >
                                    🔗 Abrir en Drive
                                </a>
                                <button
                                    onClick={() => {
                                        onSettingsClick();
                                        setDropdownOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-500 hover:text-white"
                                >
                                    ⚙️ Configuración
                                </button>
                                <div className="border-t border-gray-100 dark:border-gray-600"></div>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Usuario del sistema:</p>
                                    <div className="flex items-center space-x-2">
                                        <img className="h-6 w-6 rounded-full object-cover" src={user.picture} alt={user.name} />
                                        <span className="text-xs text-gray-600 dark:text-gray-300">{user.email}</span>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-600"></div>
                                <button
                                    onClick={() => {
                                        onLogout();
                                        setDropdownOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white"
                                >
                                    🚪 Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                     <button
                        onClick={onLoginClick}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Iniciar Sesión
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;