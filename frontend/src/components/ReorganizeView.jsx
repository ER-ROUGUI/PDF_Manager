import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowDownToLine, Loader2, FileText, Trash2, ArrowUp, ArrowDown, Eye, RefreshCw } from 'lucide-react';
import FileUploadZone from './FileUploadZone';

const ReorganizeView = () => {
    const [file, setFile] = useState(null);
    const [originalUrl, setOriginalUrl] = useState(null);
    const [pagesOrder, setPagesOrder] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState(null);

    const handleFileSelected = async (selectedFiles) => {
        const selected = selectedFiles[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setResultUrl(null);

            const objUrl = URL.createObjectURL(selected);
            setOriginalUrl(objUrl);

            try {
                const arrayBuffer = await selected.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const count = pdf.getPageCount();
                setPagesOrder(Array.from({ length: count }, (_, i) => i + 1));
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
        setPagesOrder([]);
    };

    const movePageUp = (index) => {
        if (index === 0) return;
        const newOrder = [...pagesOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setPagesOrder(newOrder);
        setResultUrl(null);
    };

    const movePageDown = (index) => {
        if (index === pagesOrder.length - 1) return;
        const newOrder = [...pagesOrder];
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        setPagesOrder(newOrder);
        setResultUrl(null);
    };

    const handlePreviewChanges = async () => {
        if (!file || pagesOrder.length === 0) return;

        setIsProcessing(true);
        try {
            const fileArrayBuffer = await file.arrayBuffer();
            const originalPdf = await PDFDocument.load(fileArrayBuffer);
            const newPdf = await PDFDocument.create();

            const indicesToCopy = pagesOrder.map(p => p - 1);
            const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);

            copiedPages.forEach(page => newPdf.addPage(page));

            const newPdfBytes = await newPdf.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });

            if (resultUrl) URL.revokeObjectURL(resultUrl);
            setResultUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error("Error reorganizing pages:", error);
            alert("Failed to reorganize pages. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Reorganize PDF Pages</h2>
                <p className="text-slate-500">Change the order of pages in your document interactively and preview instantly.</p>
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
                                <h3 className="font-semibold text-slate-700 mb-4">Source File</h3>
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                                    <div className="bg-primary-50 p-3 text-primary-600 rounded-xl">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-medium text-slate-700 truncate">{file.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {pagesOrder.length} Pages
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

                    <div className="flex-1 flex flex-col bg-slate-50 rounded-3xl p-6 border border-slate-200 min-h-[300px]">
                        <h3 className="font-semibold text-slate-700 mb-4 flex justify-between items-center shrink-0">
                            <span>Page Order</span>
                            {pagesOrder.length > 0 && (
                                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                                    Reorder pages
                                </span>
                            )}
                        </h3>

                        <div className="flex-1 overflow-auto pr-2 space-y-2 min-h-0 mb-4">
                            {pagesOrder.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                    Upload a file to see its pages
                                </div>
                            ) : (
                                pagesOrder.map((pageOrigIndex, idx) => (
                                    <div key={`${pageOrigIndex}-${idx}`} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between shadow-sm hover:border-primary-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-sm">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Orig Page {pageOrigIndex}</span>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => movePageUp(idx)}
                                                disabled={idx === 0}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                title="Move Up"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => movePageDown(idx)}
                                                disabled={idx === pagesOrder.length - 1}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                title="Move Down"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="shrink-0 pt-4 border-t border-slate-200 flex flex-col gap-3">
                            <button
                                disabled={isProcessing || !file}
                                onClick={handlePreviewChanges}
                                className="w-full py-3 px-4 bg-primary-600 disabled:bg-slate-300 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-500/20 font-medium flex items-center justify-center gap-2 transition-all"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                ) : (
                                    <><Eye className="w-5 h-5" /> Preview Order</>
                                )}
                            </button>

                            {resultUrl && (
                                <a
                                    href={resultUrl}
                                    download={`reorganized_${file?.name || 'document.pdf'}`}
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
                                {resultUrl ? 'Showing Preview of Reorganized Pages' : 'Showing Original Document'}
                            </div>
                            <iframe
                                src={`${resultUrl || originalUrl}#toolbar=0`}
                                className="w-full h-full border-0"
                                title="PDF Preview"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <RefreshCw className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="font-medium text-slate-500">No Document to Preview</p>
                            <p className="text-sm mt-2 max-w-xs">Upload a PDF file to see an interactive preview here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReorganizeView;
