import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const FileUploadZone = ({ onFilesSelected, accept = '.pdf', multiple = false, title = 'Drop your PDF here' }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(e.dataTransfer.files);
        }
    }, [onFilesSelected]);

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
        }
    };

    return (
        <div
            className={`relative w-full rounded-3xl border-2 border-dashed transition-all duration-300 ease-out p-12 flex flex-col items-center justify-center text-center cursor-pointer group ${isDragging
                    ? 'border-primary-500 bg-primary-50/50 scale-[1.02]'
                    : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50/50'
                }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
        >
            <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleChange}
            />

            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${isDragging ? 'bg-primary-100 text-primary-600 scale-110' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-500'
                }`}>
                <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-slate-800">{title}</h3>
            <p className="text-slate-500 text-sm max-w-sm">
                {multiple ? 'Select multiple PDF files or drag & drop them here' : 'Select a PDF file or drag & drop it here'}
            </p>

            <button className="mt-6 px-6 py-2.5 rounded-full bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                Browse Files
            </button>
        </div>
    );
};

export default FileUploadZone;
