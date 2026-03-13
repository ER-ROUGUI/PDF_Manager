import React from 'react';
import { Layers, FileMinus, FilePlus, ArrowRightLeft, ShieldCheck, Scissors } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView }) => {
    const menuItems = [
        { id: 'merge', label: 'Merge PDFs', icon: Layers },
        { id: 'split', label: 'Split PDF', icon: Scissors },
        { id: 'remove', label: 'Remove Pages', icon: FileMinus },
        { id: 'extract', label: 'Extract Pages', icon: FilePlus },
        { id: 'reorganize', label: 'Reorganize', icon: ArrowRightLeft },
    ];

    return (
        <div className="w-72 bg-white border-r border-slate-200/60 p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-10">
                <div className="bg-primary-600 p-2 rounded-xl shadow-lg shadow-primary-500/30">
                    <Layers className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    DocManager
                </h1>
            </div>

            <nav className="flex-1 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Tools</p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-primary-50 text-primary-700 font-medium shadow-sm ring-1 ring-primary-100'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/50">
                    <div className="flex items-center gap-2 text-primary-600 mb-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-medium text-sm">Privacy First</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        All files are processed entirely in your browser. No data leaves your machine.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
