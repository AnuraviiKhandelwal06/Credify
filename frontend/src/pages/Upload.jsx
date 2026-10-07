import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadDocumentApi, runAnalysisApi } from '../services/api';
import EducationalDisclaimer from '../components/EducationalDisclaimer';
import { UploadCloud, FileText, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Check, Lock, FolderPlus, Trash2, ChevronRight, Eye } from 'lucide-react';

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // Password-protected PDF workflow state
  const [passwordFileIndex, setPasswordFileIndex] = useState(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Completed batch results for multi-document table
  const [batchResults, setBatchResults] = useState([]);

  const filesInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();

  const getAllFilesFromDataTransfer = async (dataTransfer) => {
    const files = [];
    const items = Array.from(dataTransfer.items || []);

    const traverseEntry = (entry) => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          entry.file((file) => {
            files.push(file);
            resolve();
          }, () => resolve());
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          dirReader.readEntries(async (entries) => {
            for (const childEntry of entries) {
              await traverseEntry(childEntry);
            }
            resolve();
          }, () => resolve());
        } else {
          resolve();
        }
      });
    };

    const promises = [];
    for (const item of items) {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          promises.push(traverseEntry(entry));
        }
      } else if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    } else if (dataTransfer.files && dataTransfer.files.length > 0) {
      files.push(...Array.from(dataTransfer.files));
    }

    return files;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer) {
      const extractedFiles = await getAllFilesFromDataTransfer(e.dataTransfer);
      if (extractedFiles && extractedFiles.length > 0) {
        addFilesToList(extractedFiles);
      }
    }
  };

  const addFilesToList = (filesArray) => {
    setError('');
    setWarning('');
    setBatchResults([]);

    const validFiles = [];
    let skippedCount = 0;

    filesArray.forEach((file) => {
      const cleanName = file.name.split('/').pop().split('\\').pop();
      const ext = cleanName.split('.').pop().toLowerCase();
      if (ext === 'csv' || ext === 'pdf') {
        validFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          file: file,
          name: cleanName,
          size: file.size,
          ext: ext.toUpperCase(),
          status: 'ready',
          error: null,
          result: null
        });
      } else {
        skippedCount++;
      }
    });

    if (skippedCount > 0) {
      setWarning(`Skipped ${skippedCount} unsupported file(s). Only PDF and CSV bank statements are processed.`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => {
        const existingKeys = new Set(prev.map(f => `${f.name}_${f.size}`));
        const newItems = validFiles.filter(vf => !existingKeys.has(`${vf.name}_${vf.size}`));
        return [...prev, ...newItems];
      });
    } else if (filesArray.length > 0 && selectedFiles.length === 0) {
      setError("No supported PDF or CSV files found in selection.");
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToList(Array.from(e.target.files));
    }
  };

  const removeFile = (idToRemove) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== idToRemove));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setError('');
    setWarning('');
    setBatchResults([]);
  };

  const getFormattedSize = (sizeInBytes) => {
    if (sizeInBytes > 1048576) {
      return (sizeInBytes / 1048576).toFixed(2) + ' MB';
    }
    return (sizeInBytes / 1024).toFixed(1) + ' KB';
  };

  const PROCESSING_STAGES = [
    "Reading document...",
    "Extracting transactions...",
    "Preparing financial features...",
    "Running ML risk analysis...",
    "Generating Credify Score..."
  ];

  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Execute processing for a single document with step-by-step visual stage updates
  const processSingleFileWithStatus = async (fileObj, passwordVal = null) => {
    setCurrentStageIndex(0); // 1. Reading document...
    await delay(350);

    const formData = new FormData();
    formData.append('file', fileObj.file);
    if (passwordVal && passwordVal.trim() !== '') {
      formData.append('password', passwordVal.trim());
    }

    setCurrentStageIndex(1); // 2. Extracting transactions...
    const uploadRes = await uploadDocumentApi(formData);
    const docId = uploadRes.data.id;

    setCurrentStageIndex(2); // 3. Preparing financial features...
    await delay(350);

    setCurrentStageIndex(3); // 4. Running ML risk analysis...
    const analysisRes = await runAnalysisApi(docId);

    setCurrentStageIndex(4); // 5. Generating Credify Score...
    await delay(400);

    return {
      doc_id: docId,
      analysis_id: analysisRes.data.id,
      file_name: fileObj.name,
      file_type: fileObj.ext,
      transaction_count: analysisRes.data.financial_metrics?.transaction_count || 0,
      total_income: analysisRes.data.financial_metrics?.monthly_income ? roundVal(analysisRes.data.financial_metrics.monthly_income) : (analysisRes.data.total_income || 0),
      total_expense: analysisRes.data.financial_metrics?.monthly_expenses ? roundVal(analysisRes.data.financial_metrics.monthly_expenses) : (analysisRes.data.total_expense || 0),
      risk_category: analysisRes.data.risk_category,
      credit_score: analysisRes.data.credit_score
    };
  };

  const roundVal = (v) => Math.round(v * 100) / 100;

  // Process batch of selected documents recursively or via loop with explicit state tracking
  const processBatchLoop = async (filesList, startIndex = 0, existingResults = []) => {
    setIsProcessing(true);
    setError('');
    setPasswordError('');
    let currentFiles = [...filesList];
    const results = [...existingResults];

    for (let i = startIndex; i < currentFiles.length; i++) {
      const item = currentFiles[i];

      // Skip already completed or skipped files
      if (item.status === 'completed' && item.result) {
        if (!results.some(r => r.doc_id === item.result.doc_id)) {
          results.push(item.result);
        }
        continue;
      }
      if (item.status === 'skipped' || item.status === 'failed') {
        continue;
      }

      setProcessingIndex(i);
      currentFiles = currentFiles.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f);
      setSelectedFiles(currentFiles);

      try {
        const res = await processSingleFileWithStatus(item, item.password || null);
        
        currentFiles = currentFiles.map((f, idx) => idx === i ? { ...f, status: 'completed', error: null, result: res } : f);
        setSelectedFiles(currentFiles);
        results.push(res);

        // If single file upload succeeded, navigate directly to report page
        if (currentFiles.length === 1) {
          setIsProcessing(false);
          setProcessingIndex(-1);
          navigate(`/analysis/${res.analysis_id}`);
          return;
        }

      } catch (err) {
        console.error(`Error processing ${item.name}:`, err);
        let errMsg = err.response?.data?.detail || err.message || "Failed to process document.";
        if (typeof errMsg !== 'string') {
          errMsg = JSON.stringify(errMsg);
        }

        if (errMsg.includes("PASSWORD_REQUIRED") || errMsg.toLowerCase().includes("password-protected") || errMsg.toLowerCase().includes("password required")) {
          currentFiles = currentFiles.map((f, idx) => idx === i ? { ...f, status: 'password_required', error: "PDF is password-protected" } : f);
          setSelectedFiles(currentFiles);
          setPasswordFileIndex(i);
          setIsProcessing(false);
          return; // Pause batch to prompt user for password
        } else {
          currentFiles = currentFiles.map((f, idx) => idx === i ? { ...f, status: 'failed', error: errMsg } : f);
          setSelectedFiles(currentFiles);
        }
      }
    }

    setIsProcessing(false);
    setProcessingIndex(-1);
    setBatchResults(results);

    if (currentFiles.length === 1 && results.length === 1) {
      navigate(`/analysis/${results[0].analysis_id}`);
    }
  };

  const handleProcessBatch = () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one PDF or CSV bank statement.");
      return;
    }
    processBatchLoop(selectedFiles, 0, []);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pdfPassword || pdfPassword.trim() === '') {
      setPasswordError("Please enter the PDF password.");
      return;
    }

    if (passwordFileIndex === null || !selectedFiles[passwordFileIndex]) return;

    const item = selectedFiles[passwordFileIndex];
    setPasswordError('');
    setIsProcessing(true);

    try {
      const res = await processSingleFileWithStatus(item, pdfPassword);
      
      const updatedFiles = selectedFiles.map((f, idx) => 
        idx === passwordFileIndex 
          ? { ...f, status: 'completed', password: pdfPassword.trim(), result: res, error: null } 
          : f
      );
      setSelectedFiles(updatedFiles);
      setPasswordFileIndex(null);
      setPdfPassword('');

      // If single file, navigate directly to analysis page
      if (updatedFiles.length === 1) {
        setIsProcessing(false);
        navigate(`/analysis/${res.analysis_id}`);
        return;
      }

      // Continue batch processing for remaining files
      const updatedResults = [...batchResults, res];
      processBatchLoop(updatedFiles, passwordFileIndex + 1, updatedResults);

    } catch (err) {
      setIsProcessing(false);
      let errMsg = err.response?.data?.detail || err.message || "Failed to unlock PDF.";
      if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);

      if (errMsg.toLowerCase().includes("incorrect pdf password") || errMsg.toLowerCase().includes("password")) {
        setPasswordError("Incorrect PDF password. Please try again.");
      } else {
        setPasswordError(errMsg);
      }
    }
  };


  const skipPasswordFile = () => {
    if (passwordFileIndex !== null && selectedFiles[passwordFileIndex]) {
      const item = selectedFiles[passwordFileIndex];
      const updatedFiles = selectedFiles.map((f, idx) => 
        idx === passwordFileIndex ? { ...f, status: 'skipped', error: "Password required / Skipped" } : f
      );
      setSelectedFiles(updatedFiles);
      setPasswordFileIndex(null);
      setPdfPassword('');
      setPasswordError('');
      
      processBatchLoop(updatedFiles, passwordFileIndex + 1, batchResults);
    }
  };

  const updateItemStatus = (id, status, errorMsg = null, resultObj = null) => {
    setSelectedFiles(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: status,
          error: errorMsg,
          result: resultObj || item.result
        };
      }
      return item;
    }));
  };


  // Quick Demo Statement Upload
  const handleQuickDemoUpload = async () => {
    clearAllFiles();
    const sampleCsvContent = `Date,Description,Amount,Type,Balance
2026-01-01,Monthly Salary - TechCorp Ltd,65000.00,CREDIT,65000.00
2026-01-02,Apartment Rent Payment,18000.00,DEBIT,47000.00
2026-01-03,Supermarket Grocery Store,3450.50,DEBIT,43549.50
2026-01-05,Electricity & Water Utility Bill,2200.00,DEBIT,41349.50
2026-01-07,Cafeteria & Lunch Combo,450.00,DEBIT,40899.50
2026-01-10,Fuel Station Filling,2500.00,DEBIT,38399.50
2026-01-12,Freelance Graphic Design Payment,8500.00,CREDIT,46899.50
2026-01-15,Netflix & Spotify Subscription,899.00,DEBIT,46000.50
2026-01-18,Electronics & Accessories Shop,4200.00,DEBIT,41800.50
2026-01-20,Restaurant Dining Out,1850.00,DEBIT,39950.50
2026-01-25,Wi-Fi & Broadband Bill,1199.00,DEBIT,38751.50
2026-01-28,Pharmacy & Health Store,650.00,DEBIT,38101.50
2026-02-01,Monthly Salary - TechCorp Ltd,65000.00,CREDIT,103101.50
2026-02-02,Apartment Rent Payment,18000.00,DEBIT,85101.50
2026-02-04,Supermarket Grocery Store,3820.00,DEBIT,81281.50
2026-02-06,Electricity & Utility Bill,2400.00,DEBIT,78881.50
2026-02-09,Fuel & Auto Service,3100.00,DEBIT,75781.50
2026-02-12,Cash Withdrawal ATM,5000.00,DEBIT,70781.50
2026-02-14,Valentine Dinner & Flowers,2950.00,DEBIT,67831.50
2026-02-17,E-commerce Clothing Purchase,3499.00,DEBIT,64332.50
2026-02-20,Freelance Consulting Payment,12000.00,CREDIT,76332.50
2026-02-24,Mobile Recharge & Bill,799.00,DEBIT,75533.50
2026-02-27,Gym & Fitness Membership,1500.00,DEBIT,74033.50
2026-03-01,Monthly Salary - TechCorp Ltd,65000.00,CREDIT,139033.50
2026-03-02,Apartment Rent Payment,18000.00,DEBIT,121033.50
2026-03-05,Supermarket Grocery Store,4100.00,DEBIT,116933.50
2026-03-08,Electricity & Water Utility Bill,2150.00,DEBIT,114783.50
2026-03-11,Online Course Subscription,2499.00,DEBIT,112284.50
2026-03-14,Fuel Station Filling,2600.00,DEBIT,109684.50
2026-03-17,Dining & Social Gathering,2100.00,DEBIT,107584.50
2026-03-20,Dividend Interest Credit,1250.00,CREDIT,108834.50
2026-03-22,Home Appliance Purchase,6800.00,DEBIT,102034.50
2026-03-25,Wi-Fi & Broadband Bill,1199.00,DEBIT,100835.50
2026-03-28,Pharmacy & Medical Care,920.00,DEBIT,99915.50
2026-03-30,Weekend Trip & Travel Expenses,5500.00,DEBIT,94415.50`;

    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const file = new File([blob], 'sample_bank_statement.csv', { type: 'text/csv' });
    addFilesToList([file]);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Upload Bank Statement</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload single or multiple bank statements (PDF or CSV) or select a folder for automated credit risk prediction.
        </p>
      </div>

      <EducationalDisclaimer />

      {/* Format Support Badges */}
      <div className="flex items-center space-x-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>✓ PDF supported</span>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
          <Check className="h-3.5 w-3.5 text-indigo-400" />
          <span>✓ CSV supported</span>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
          <Check className="h-3.5 w-3.5 text-purple-400" />
          <span>✓ Folder & Multi-File supported</span>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs sm:text-sm text-rose-300 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {warning && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300 flex items-start space-x-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {/* RESTORED PREVIOUS PROCESSING UI SCREEN */}
        {isProcessing ? (
          <div className="py-6 space-y-8 max-w-lg mx-auto">
            {/* Animated Icon & Title Header */}
            <div className="text-center space-y-3">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl animate-pulse"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                  <Sparkles className="h-8 w-8 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  {PROCESSING_STAGES[currentStageIndex] || "Processing Statement..."}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedFiles[processingIndex]?.name 
                    ? `Processing ${selectedFiles[processingIndex].name}...`
                    : "Extracting transactions & predicting Credify Score..."}
                </p>
              </div>
            </div>

            {/* Percentage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Analysis Progress</span>
                <span className="font-mono text-indigo-300">
                  {Math.round(((currentStageIndex + 1) / PROCESSING_STAGES.length) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 ease-out shadow-sm shadow-indigo-500/50"
                  style={{ width: `${Math.round(((currentStageIndex + 1) / PROCESSING_STAGES.length) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Step-by-Step 5-Stage Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              {PROCESSING_STAGES.map((stageLabel, index) => {
                const isDone = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${
                      isCurrent 
                        ? 'bg-indigo-950/60 border border-indigo-500/40 text-slate-100 shadow-md shadow-indigo-950/30' 
                        : isDone 
                        ? 'bg-slate-900/40 border border-slate-800/50 text-slate-300' 
                        : 'text-slate-500 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-xs font-medium">
                      {isDone ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <div className="h-4.5 w-4.5 shrink-0 flex items-center justify-center">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-slate-700 shrink-0"></div>
                      )}
                      <span className={isCurrent ? "font-bold text-indigo-200 text-sm" : isDone ? "text-slate-300" : "text-slate-500"}>
                        {stageLabel}
                      </span>
                    </div>

                    {isDone && (
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Done</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-400 animate-pulse uppercase tracking-wider">Active</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : passwordFileIndex !== null && selectedFiles[passwordFileIndex] ? (

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="rounded-2xl bg-indigo-950/50 border border-indigo-500/40 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Password-Protected PDF Detected</h3>
                  <p className="text-xs text-slate-300">
                    File: <span className="font-semibold text-indigo-300">{selectedFiles[passwordFileIndex].name}</span>
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">PDF Password</label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => {
                    setPdfPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter PDF Password"
                  autoFocus
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={skipPasswordFile}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Skip This File
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                >
                  <span>Unlock & Process</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* File Selector & Drag-and-Drop Area */
          <div className="space-y-6">
            <input
              type="file"
              ref={filesInputRef}
              multiple
              accept=".csv,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="file"
              ref={folderInputRef}
              webkitdirectory=""
              directory=""
              multiple
              accept=".csv,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                  : selectedFiles.length > 0
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40'
              }`}
            >
              <div className="space-y-4 flex flex-col items-center justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${
                  selectedFiles.length > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}>
                  {selectedFiles.length > 0 ? <FileText className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" />}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">
                    Drag & Drop statement file(s) or folder here
                  </p>
                  <p className="text-xs text-slate-400">Supports PDF and CSV bank statements</p>
                </div>

                {/* File & Folder Browse Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => filesInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 transition-colors"
                  >
                    <UploadCloud className="h-4 w-4 text-indigo-400" />
                    <span>Select Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 px-4 py-2 text-xs font-semibold text-purple-300 transition-colors"
                  >
                    <FolderPlus className="h-4 w-4 text-purple-400" />
                    <span>Select Folder</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Documents List View */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span>Selected Documents ({selectedFiles.length})</span>
                  </h3>

                  <button
                    type="button"
                    onClick={clearAllFiles}
                    disabled={isProcessing}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear List
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
                  {selectedFiles.map((item, idx) => {
                    const isCurrentProcessing = processingIndex === idx;
                    return (
                      <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`p-2 rounded-lg ${item.ext === 'PDF' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {item.ext === 'PDF' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.ext} • {getFormattedSize(item.size)}
                            </p>
                            {item.status === 'failed' && item.error && (
                              <p className="text-[11px] text-rose-400 font-medium truncate mt-0.5" title={item.error}>
                                Reason: {item.error}
                              </p>
                            )}
                            {item.status === 'password_required' && (
                              <p className="text-[11px] text-amber-400 font-medium truncate mt-0.5">
                                Password required
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          {/* Status Indicator */}
                          {item.status === 'completed' ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : item.status === 'processing' ? (
                            <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-400 animate-pulse">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
                              <span>Processing...</span>
                            </span>
                          ) : item.status === 'password_required' ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-400">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Password Required</span>
                            </span>
                          ) : item.status === 'failed' ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-rose-400" title={item.error}>
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Failed</span>
                            </span>
                          ) : item.status === 'skipped' ? (
                            <span className="text-[11px] text-slate-500 font-medium">Skipped</span>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-medium">✓ Ready</span>
                          )}

                          {!isProcessing && (
                            <button
                              type="button"
                              onClick={() => removeFile(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleQuickDemoUpload}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 px-4 py-2.5 text-xs font-semibold text-purple-300 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Test with Sample Bank Statement (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleProcessBatch}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40"
              >
                <span>Process & Analyze ({selectedFiles.length})</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Document Results Table */}
      {batchResults.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Multi-Document Analysis Results</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Processed {batchResults.length} statement document(s) independently</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">Document</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-center">Transactions</th>
                  <th className="py-3 px-3 text-right">Income</th>
                  <th className="py-3 px-3 text-right">Expenses</th>
                  <th className="py-3 px-3 text-center">Risk</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batchResults.map((res, i) => (
                  <tr key={res.doc_id || i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200 flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span className="truncate max-w-xs">{res.file_name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{res.file_type}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{res.transaction_count}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">₹{res.total_income.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400 font-medium">₹{res.total_expense.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        res.risk_category === 'Low' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        res.risk_category === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {res.risk_category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-white text-sm">{res.credit_score}</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/analysis/${res.analysis_id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30 transition-colors"
                      >
                        <span>View Report</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
