import React, { useRef, useState, useId } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Alert } from './Alert';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
}

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  sublabel?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  progress?: number | null;
  error?: string | null;
  files?: UploadedFileItem[];
  onSelectFiles: (files: FileList | null) => void;
  onRemoveFile?: (id: string) => void;
  className?: string;
}

export const formatFileBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  helperText,
  sublabel = 'Max 15MB per file. Securely stored and accessible only to your project.',
  accept,
  multiple = true,
  disabled = false,
  progress = null,
  error = null,
  files = [],
  onSelectFiles,
  onRemoveFile,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const generatedId = useId();

  const handleOpenPicker = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {(label || helperText) && (
        <div>
          {label && (
            <label
              htmlFor={generatedId}
              className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1"
            >
              {label}
            </label>
          )}
          {helperText && (
            <p className="text-xs text-[var(--color-text-secondary)] tabular-nums leading-relaxed">
              {helperText}
            </p>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) {
            onSelectFiles(e.dataTransfer.files);
          }
        }}
        className={`border border-dashed rounded-[var(--radius-card)] p-6 sm:p-8 text-center transition-colors ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-[var(--color-disabled-bg)] border-[var(--color-border)]'
            : isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)]'
            : 'border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]/60 hover:bg-[var(--color-surface-secondary)]'
        }`}
      >
        <input
          id={generatedId}
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            onSelectFiles(e.target.files);
            if (inputRef.current) {
              inputRef.current.value = '';
            }
          }}
        />

        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] mb-3">
            <Upload className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">
            Drag and drop files here, or{' '}
            <button
              type="button"
              disabled={disabled}
              onClick={handleOpenPicker}
              className="text-[var(--color-text-primary)] font-semibold underline underline-offset-2 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed"
            >
              browse files
            </button>
          </p>
          {sublabel && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 tabular-nums">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      {progress !== null && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs tabular-nums"
        >
          <div className="flex items-center justify-between mb-1.5 text-[var(--color-text-primary)] font-medium">
            <span>Uploading attachment…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[13px] font-medium text-[var(--color-text-primary)] tabular-nums">
            Uploaded Files ({files.length})
          </div>
          <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-[var(--radius-button)] overflow-hidden bg-[var(--color-surface)]">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-3 flex items-center justify-between gap-2 text-[13px] hover:bg-[var(--color-surface-secondary)]/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[var(--color-text-primary)] truncate">
                    {file.name}
                  </span>
                  <span className="text-[var(--color-text-secondary)] text-xs tabular-nums shrink-0">
                    ({formatFileBytes(file.size)})
                  </span>
                </div>

                {onRemoveFile && (
                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    onClick={() => onRemoveFile(file.id)}
                    className="hover:text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
                    title="Remove file"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
