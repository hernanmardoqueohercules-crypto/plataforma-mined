import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MonitorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m-6-10h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2m6-10a2 2 0 00-2-2h-2a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2m-6-10h6" />
    </svg>
);

const SupervisionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const SchoolIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const navItems = [
    { id: 'monitoreo', label: 'Monitoreo', icon: <MonitorIcon /> },
    { id: 'supervision', label: 'Supervisión', icon: <SupervisionIcon /> },
    { id: 'centros-escolares', label: 'Centros Escolares', icon: <SchoolIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen }) => {
    return (
        <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-800 dark:bg-gray-900 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
            <div className="flex items-center justify-center h-20 shadow-md bg-gray-900 dark:bg-black/20 px-4">
                <img src="https://www.mined.gob.sv/wp-content/uploads/2021/logo_mined.png" alt="Logo MINED" className="h-12" />
            </div>
            <ul className="flex flex-col py-4 space-y-1">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <button
                            onClick={() => onViewChange(item.id as View)}
                            className={`relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-700 text-gray-300 hover:text-white border-l-4 border-transparent hover:border-indigo-500 pr-6 w-full text-left transition-colors duration-200 ${activeView === item.id ? 'bg-gray-700 border-indigo-500 text-white' : ''}`}
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                {item.icon}
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;