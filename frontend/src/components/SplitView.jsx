import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Scissors, FileText, Trash2, ArrowDownToLine, Loader2, Plus, Eye, Download, Archive } from 'lucide-react';
import FileUploadZone from './FileUploadZone';
import JSZip from 'jszip';

const SplitView = () => {
    const [file, setFile] = useState(null);
    const [originalUrl, setOriginalUrl] = useState(null);
    const [totalPages, setTotalPages] = useState(0);

    const [splitMode, setSplitMode] = useState('half'); // 'half' | 'custom'
    const [customParts, setCustomParts] = useState([{ id: Date.now(), range: '' }]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [resultParts, setResultParts] = useState([]); // { name: string, url: string }[]
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);

    const handleFileSelected = async (selectedFiles) => {
        const selected = selectedFiles[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setResultParts([]);
            setActivePreviewIndex(0);

            const objUrl = URL.createObjectURL(selected);
            setOriginalUrl(objUrl);

            try {
                const arrayBuffer = await selected.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const count = pdf.getPageCount();
                setTotalPages(count);

                // Reset custom parts intelligently
                if (count >= 2) {
                    const mid = Math.ceil(count / 2);
                    setCustomParts([
                        { id: Date.now(), range: `1-${mid}` },
                        { id: Date.now() + 1, range: `${mid + 1}-${count}` }
                    ]);
                } else {
                    setCustomParts([{ id: Date.now(), range: `1-${count}` }]);
                }
            } catch (e) {
                console.error("Failed to load PDF to get page count", e);
            }
        }
    };

    const removeFile = () => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        resultParts.forEach(part => URL.revokeObjectURL(part.url));
        setFile(null);
        setOriginalUrl(null);
        setResultParts([]);
        setTotalPages(0);
        setSplitMode('half');
        setCustomParts([{ id: Date.now(), range: '' }]);
    };

    const addCustomPart = () => {
        setCustomParts([...customParts, { id: Date.now(), range: '' }]);
        setResultParts([]); // clear prev results
    };

    const removeCustomPart = (idToRemove) => {
        if (customParts.length > 1) {
            setCustomParts(customParts.filter(p => p.id !== idToRemove));
            setResultParts([]);
        }
    };

    const updateCustomPart = (id, newRange) => {
        setCustomParts(customParts.map(p => p.id === id ? { ...p, range: newRange } : p));
        setResultParts([]);
    };

    const parsePageNumbers = (input, maxPages) => {
        const pages = new Set();
        const parts = input.split(',').map(p => p.trim());

        for (const part of parts) {
            if (!part) continue;
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i);
                    }
                }
            } else {
                const num = Number(part);
                if (!isNaN(num) && num >= 1 && num <= maxPages) {
                    pages.add(num);
                }
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    };

    const handlePreviewSplit = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const fileArrayBuffer = await file.arrayBuffer();
            const originalPdf = await PDFDocument.load(fileArrayBuffer);
            const count = originalPdf.getPageCount();

            let rangesToProcess = [];

            if (splitMode === 'half') {
                const mid = Math.ceil(count / 2);
                if (count <= 1) {
                    rangesToProcess.push(`1-${count}`);
                } else {
                    rangesToProcess.push(`1-${mid}`);
                    rangesToProcess.push(`${mid + 1}-${count}`);
                }
            } else {
                rangesToProcess = customParts.map(p => p.range).filter(r => r.trim() !== '');
                if (rangesToProcess.length === 0) {
                    alert('Please enter at least one valid page range.');
                    setIsProcessing(false);
                    return;
                }
            }

            const newResultParts = [];

            const originalName = file.name.replace(/\.[^/.]+$/, "");

            for (let i = 0; i < rangesToProcess.length; i++) {
                const rangeStr = rangesToProcess[i];
                const pageNums = parsePageNumbers(rangeStr, count);

                if (pageNums.length === 0) continue;

                const newPdf = await PDFDocument.create();
                const indicesToCopy = pageNums.map(p => p - 1);
                const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);

                copiedPages.forEach(page => newPdf.addPage(page));

                const newPdfBytes = await newPdf.save();
                const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                newResultParts.push({
                    name: `${originalName}_part${i + 1}.pdf`,
                    url: url
                });
            }

            if (newResultParts.length === 0) {
                alert("No valid pages found to split based on your input.");
                setIsProcessing(false);
                return;
            }

            // Cleanup old blobs
            resultParts.forEach(part => URL.revokeObjectURL(part.url));

            setResultParts(newResultParts);
            setActivePreviewIndex(0);

        } catch (error) {
            console.error("Error splitting PDF:", error);
            alert("Failed to split PDF. Please check your ranges and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadAll = async () => {
        if (resultParts.length === 0) return;

        if (resultParts.length === 1) {
            // Only 1 part, just download it directly
            const a = document.createElement('a');
            a.href = resultParts[0].url;
            a.download = resultParts[0].name;
            a.click();
            return;
        }

        // Multiple parts, create a ZIP
        try {
            const zip = new JSZip();

            for (const part of resultParts) {
                // Fetch the blob from the object URL to add it to the ZIP
                const response = await fetch(part.url);
                const blob = await response.blob();
                zip.file(part.name, blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);

            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `${originalName}_split_files.zip`;
            a.click();

            // Clean up zip url
            setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
        } catch (error) {
            console.error("Error creating ZIP file:", error);
            alert("Failed to create ZIP file. You can still download parts individually.");
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Split PDF</h2>
                <p className="text-slate-500">Divide your PDF into multiple documents by cutting it in half or specifying custom page ranges.</p>
            </div>

            <div className="flex-1 flex flex-col items-stretch lg:flex-row gap-8 min-h-0">
                {/* Left Controls */}
                <div className="w-full lg:w-[450px] flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
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
                        <h3 className="font-semibold text-slate-700 mb-4">Split Configuration</h3>

                        <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => { setSplitMode('half'); setResultParts([]); }}
                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${splitMode === 'half' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Split in Half
                            </button>
                            <button
                                onClick={() => { setSplitMode('custom'); setResultParts([]); }}
                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${splitMode === 'custom' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Custom Ranges
                            </button>
                        </div>

                        {splitMode === 'half' ? (
                            <div className="bg-white border text-center border-slate-200 p-6 rounded-2xl shadow-sm mb-4">
                                <Scissors className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                                <h4 className="font-medium text-slate-700">Split Document in Half</h4>
                                <p className="text-sm text-slate-500 mt-2">
                                    {totalPages > 0
                                        ? `Part 1 will contain pages 1 to ${Math.ceil(totalPages / 2)}. Part 2 will contain the rest.`
                                        : 'Upload a document to split it down the middle.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-4 flex-1">
                                {customParts.map((part, index) => (
                                    <div key={part.id} className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={part.range}
                                                onChange={(e) => updateCustomPart(part.id, e.target.value)}
                                                placeholder={`e.g. ${index === 0 ? '1-5' : '6-10'}`}
                                                disabled={!file}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeCustomPart(part.id)}
                                            disabled={customParts.length <= 1 || !file}
                                            className="p-2.5 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addCustomPart}
                                    disabled={!file}
                                    className="w-full py-2.5 mt-2 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" /> Add Part
                                </button>
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Define segments using ranges like "1-5" or distinct pages like "1, 3, 5".
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
                            <button
                                disabled={!file || isProcessing}
                                onClick={handlePreviewSplit}
                                className="w-full py-3 px-4 bg-primary-600 disabled:bg-slate-300 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-500/20 font-medium flex items-center justify-center gap-2 transition-all"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                ) : (
                                    <><Eye className="w-5 h-5" /> Preview Split</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Preview Panel */}
                <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden flex flex-col relative min-h-[500px]">
                    {(resultParts.length > 0) ? (
                        <>
                            <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between shrink-0">
                                <div className="flex gap-2 items-center overflow-x-auto pr-4 pb-1">
                                    {resultParts.map((part, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePreviewIndex(idx)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activePreviewIndex === idx
                                                    ? 'bg-primary-100 text-primary-700 shadow-sm'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            Part {idx + 1}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href={resultParts[activePreviewIndex].url}
                                        download={resultParts[activePreviewIndex].name}
                                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                        title="Download this part"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Download Part</span>
                                    </a>
                                    {resultParts.length > 1 && (
                                        <button
                                            onClick={handleDownloadAll}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                                            title="Download all parts as a ZIP file"
                                        >
                                            <Archive className="w-4 h-4" />
                                            <span className="hidden sm:inline">Download All (ZIP)</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <iframe
                                    src={`${resultParts[activePreviewIndex].url}#toolbar=0`}
                                    className="absolute inset-0 w-full h-full border-0"
                                    title={`Preview Part ${activePreviewIndex + 1}`}
                                />
                            </div>
                        </>
                    ) : originalUrl ? (
                        <>
                            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm border border-slate-200/50">
                                Showing Original Document
                            </div>
                            <iframe
                                src={`${originalUrl}#toolbar=0`}
                                className="w-full h-full border-0"
                                title="Original PDF Preview"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <Scissors className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="font-medium text-slate-500">No Document to Preview</p>
                            <p className="text-sm mt-2 max-w-xs">Upload a PDF file to preview it here, then configure your split settings.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SplitView;
