import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MergeView from './components/MergeView';
import RemovePagesView from './components/RemovePagesView';
import ExtractPagesView from './components/ExtractPagesView';
import ReorganizeView from './components/ReorganizeView';
import SplitView from './components/SplitView';

function App() {
  const [currentView, setCurrentView] = useState('merge');

  const renderView = () => {
    switch (currentView) {
      case 'merge': return <MergeView />;
      case 'split': return <SplitView />;
      case 'remove': return <RemovePagesView />;
      case 'extract': return <ExtractPagesView />;
      case 'reorganize': return <ReorganizeView />;
      default: return <MergeView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <header className="h-20 border-b border-slate-200/60 bg-white/50 backdrop-blur flex items-center px-10 z-10">
          <h2 className="text-lg font-medium text-slate-800 capitalize flex items-center gap-2">
            {currentView === 'remove' ? 'Remove Pages' :
              currentView === 'extract' ? 'Extract Pages' :
                currentView === 'split' ? 'Split PDF' :
                  currentView === 'merge' ? 'Merge PDFs' : 'Reorganize PDF'}
          </h2>
        </header>

        <main className="flex-1 overflow-auto p-10 z-10">
          <div className="max-w-[1600px] w-full mx-auto h-full">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 min-h-[600px] h-full overflow-hidden flex flex-col">
              {renderView()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
