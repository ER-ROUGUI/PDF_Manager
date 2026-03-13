import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileMinus, ArrowDownToLine, Loader2, FileText, Trash2, Eye } from 'lucide-react';
import FileUploadZone from './FileUploadZone';

const RemovePagesView = () => {
    const [file, setFile] = useState(null);
    const [originalUrl, setOriginalUrl] = useState(null);
    const [pageInput, setPageInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState(null);
    const [totalPages, setTotalPages] = useState(0);

    const handleFileSelected = async (selectedFiles) => {
        const selected = selectedFiles[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setResultUrl(null);
            setPageInput('');

            const objUrl = URL.createObjectURL(selected);
            setOriginalUrl(objUrl);

            try {
                const arrayBuffer = await selected.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                setTotalPages(pdf.getPageCount());
            } catch (e) {
                console.error("Failed to load PDF to get page count", e);
            }
        }
    };

    const removeFile = () => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        setFile(null);
        setResultUrl(null);
        setOriginalUrl(null);
        setTotalPages(0);
        setPageInput('');
    };

    const parsePageNumbers = (input, maxPages) => {
        const pagesToRemove = new Set();
        const parts = input.split(',').map(p => p.trim());

        for (const part of parts) {
            if (!part) continue;
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pagesToRemove.add(i);
                    }
                }
            } else {
                const num = Number(part);
                if (!isNaN(num) && num >= 1 && num <= maxPages) {
                    pagesToRemove.add(num);
                }
            }
        }
        return Array.from(pagesToRemove);
    };

    const handlePreviewChanges = async () => {
        if (!file || !pageInput.trim()) return;

        setIsProcessing(true);
        try {
            const fileArrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileArrayBuffer);
            const pageCount = pdf.getPageCount();

            const pagesToRemove = parsePageNumbers(pageInput, pageCount);
            const sortedToRemove = pagesToRemove.sort((a, b) => b - a);

            for (const pageNum of sortedToRemove) {
                pdf.removePage(pageNum - 1);
            }

            const modifiedPdfBytes = await pdf.save();
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

            if (resultUrl) URL.revokeObjectURL(resultUrl);
            setResultUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error("Error removing pages:", error);
            alert("Failed to remove pages. Please check your input and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Remove Pages</h2>
                <p className="text-slate-500">Delete specific pages and preview the result instantly in your browser.</p>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                {/* Left Controls */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
                    <div className="shrink-0 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        {!file ? (
                            <FileUploadZone
                                onFilesSelected={handleFileSelected}
                                multiple={false}
                                title="Drop PDF here"
                            />
                        ) : (
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-4">Selected File</h3>
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                                    <div className="bg-primary-50 p-3 text-primary-600 rounded-xl">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-medium text-slate-700 truncate">{file.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} Pages
                                        </p>
                                    </div>
                                    <button
                                        onClick={removeFile}
                                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex flex-col bg-slate-50 rounded-3xl p-6 border border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-4">Configuration</h3>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Pages to Remove
                            </label>
                            <input
                                type="text"
                                value={pageInput}
                                onChange={(e) => {
                                    setPageInput(e.target.value);
                                    setResultUrl(null); // Clear result when input changes to indicate it needs re-processing
                                }}
                                placeholder="e.g. 1, 3-5, 8"
                                disabled={!file}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                            />
                            <p className="text-xs text-slate-500 mt-2 flex gap-1">
                                <span>💡</span>
                                <span>Use commas for multiple pages and hyphens for ranges.</span>
                            </p>
                        </div>

                        <div className="pt-6 mt-4 border-t border-slate-200 flex flex-col gap-3">
                            <button
                                disabled={!file || !pageInput.trim() || isProcessing}
                                onClick={handlePreviewChanges}
                                className="w-full py-3 px-4 bg-primary-600 disabled:bg-slate-300 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-500/20 font-medium flex items-center justify-center gap-2 transition-all"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                ) : (
                                    <><Eye className="w-5 h-5" /> Preview Changes</>
                                )}
                            </button>

                            {resultUrl && (
                                <a
                                    href={resultUrl}
                                    download={`removed_${file?.name || 'document.pdf'}`}
                                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md shadow-green-500/20 font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ArrowDownToLine className="w-5 h-5" />
                                    Download Final PDF
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Preview Panel */}
                <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden flex flex-col relative min-h-[500px]">
                    {(resultUrl || originalUrl) ? (
                        <>
                            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm border border-slate-200/50">
                                {resultUrl ? 'Showing Preview of Changes' : 'Showing Original Document'}
                            </div>
                            <iframe
                                src={`${resultUrl || originalUrl}#toolbar=0`}
                                className="w-full h-full border-0"
                                title="PDF Preview"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <FileMinus className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="font-medium text-slate-500">No Document to Preview</p>
                            <p className="text-sm mt-2 max-w-xs">Upload a PDF file to see an interactive preview here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemovePagesView;
