import { useState } from 'react';
import { formatFileSize } from '../utils/helpers';

const FileUpload = ({ file, onFileSelect, onDrop, onRemove, strategy, onStrategyChange, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDropInternal = (e) => {
    setIsDragging(false);
    if (!disabled) {
      onDrop(e);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !disabled) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropInternal}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-violet bg-violet/10'
              : 'border-violet/40 hover:border-violet/60 hover:bg-violet/5'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.txt"
            onChange={handleFileInputChange}
            disabled={disabled}
          />
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              {/* Upload Icon */}
              <svg
                className="w-16 h-16 text-violet/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              
              <div>
                <p className="text-lg text-text-primary font-medium mb-1">
                  Drag & drop your file here
                </p>
                <p className="text-sm text-violet font-medium">or Browse Files</p>
              </div>
              
              <p className="text-xs text-text-secondary">
                Supports PDF and TXT files (max 10MB)
              </p>
            </div>
          </label>
        </div>
      ) : (
        /* Selected File Display */
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{file.name}</p>
              <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={onRemove}
              className="text-error hover:text-error/80 transition-colors"
              aria-label="Remove file"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Chunking Strategy */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Chunking Strategy
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onStrategyChange('fixed')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${strategy === 'fixed'
                ? 'bg-violet text-white'
                : 'bg-transparent border border-white/10 text-text-secondary hover:border-violet/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Fixed Size
          </button>
          <button
            onClick={() => onStrategyChange('sentence')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${strategy === 'sentence'
                ? 'bg-violet text-white'
                : 'bg-transparent border border-white/10 text-text-secondary hover:border-violet/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Sentence Based
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
