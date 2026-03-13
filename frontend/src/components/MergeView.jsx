import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Trash2, FileText, ArrowDownToLine, Loader2, GripVertical, Layers, Eye } from 'lucide-react';
import FileUploadZone from './FileUploadZone';

const MergeView = () => {
    const [files, setFiles] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [mergedPdfUrl, setMergedPdfUrl] = useState(null);

    // Provide the original URL of the first file if no merge preview exists
    const firstObjUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null;

    const handleFilesSelected = (selectedFiles) => {
        const newFiles = Array.from(selectedFiles).filter(file => file.type === 'application/pdf');
        setFiles(prev => [...prev, ...newFiles]);
        setMergedPdfUrl(null);
    };

    const removeFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setMergedPdfUrl(null);
    };

    const handlePreviewMerge = async () => {
        if (files.length < 2) return;
        setIsMerging(true);

        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const fileArrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(fileArrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfFile = await mergedPdf.save();
            const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });

            if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
            setMergedPdfUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error("Error merging PDFs:", error);
            alert("Failed to merge PDFs. Please try again.");
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Merge PDF Files</h2>
                <p className="text-slate-500">Combine multiple PDF documents and preview the merged result instantly.</p>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                {/* Left Controls */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
                    <div className="shrink-0 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <FileUploadZone
                            onFilesSelected={handleFilesSelected}
                            multiple={true}
                            title="Drop PDFs to merge"
                        />
                    </div>

                    <div className="flex-1 flex flex-col bg-slate-50 rounded-3xl p-6 border border-slate-200 min-h-[300px]">
                        <h3 className="font-semibold text-slate-700 mb-4 flex justify-between items-center shrink-0">
                            <span>Files to Merge</span>
                            <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                                {files.length} selected
                            </span>
                        </h3>

                        <div className="flex-1 overflow-auto pr-2 space-y-3 min-h-0 mb-4">
                            {files.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                    No files selected yet
                                </div>
                            ) : (
                                files.map((file, idx) => (
                                    <div key={idx} className="group bg-white border border-slate-200 p-3 rounded-2xl flex items-center gap-3 shadow-sm hover:border-primary-300 transition-colors">
                                        <div className="cursor-grab text-slate-300 hover:text-slate-500">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div className="bg-primary-50 p-2 text-primary-600 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="shrink-0 pt-4 border-t border-slate-200 flex flex-col gap-3">
                            <button
                                disabled={files.length < 2 || isMerging}
                                onClick={handlePreviewMerge}
                                className="w-full py-3 px-4 bg-primary-600 disabled:bg-slate-300 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-500/20 font-medium flex items-center justify-center gap-2 transition-all"
                            >
                                {isMerging ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Merging...</>
                                ) : (
                                    <><Eye className="w-5 h-5" /> Preview Merge</>
                                )}
                            </button>
                            {files.length === 1 && !mergedPdfUrl && (
                                <p className="text-xs text-center text-amber-600 font-medium">Add at least 2 files to merge</p>
                            )}

                            {mergedPdfUrl && (
                                <a
                                    href={mergedPdfUrl}
                                    download="merged_document.pdf"
                                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md shadow-green-500/20 font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ArrowDownToLine className="w-5 h-5" />
                                    Download Merged PDF
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Preview Panel */}
                <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden flex flex-col relative min-h-[500px]">
                    {(mergedPdfUrl || firstObjUrl) ? (
                        <>
                            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm border border-slate-200/50">
                                {mergedPdfUrl ? 'Showing Preview of Merged Document' : 'Showing Preview of First Document'}
                            </div>
                            <iframe
                                src={`${mergedPdfUrl || firstObjUrl}#toolbar=0`}
                                className="w-full h-full border-0"
                                title="PDF Preview"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <Layers className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="font-medium text-slate-500">No Document to Preview</p>
                            <p className="text-sm mt-2 max-w-xs">Upload some PDF files to see an interactive preview here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MergeView;
