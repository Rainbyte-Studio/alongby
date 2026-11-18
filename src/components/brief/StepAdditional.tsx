import React, { useState, useRef } from 'react';
import { ProjectBrief, ProjectAttachment } from '../../types';
import { attachmentService } from '../../services/attachmentService';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Upload, FileText, Trash2, AlertCircle } from 'lucide-react';

interface StepAdditionalProps {
  brief: ProjectBrief;
  projectId: string;
  uploaderId: string;
  onChange: (updates: Partial<ProjectBrief>) => void;
}

export const StepAdditional: React.FC<StepAdditionalProps> = ({
  brief,
  projectId,
  uploaderId,
  onChange,
}) => {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const fileList = Array.from(files);
    for (const file of fileList) {
      const validation = attachmentService.validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }
    }

    try {
      const newAttachments: ProjectAttachment[] = [...(brief.attachments || [])];

      for (const file of fileList) {
        setUploadProgress(10);
        const attachment = await attachmentService.uploadAttachment(
          projectId,
          uploaderId,
          file,
          (pct) => setUploadProgress(pct)
        );
        newAttachments.push(attachment);
      }

      onChange({ attachments: newAttachments });
    } catch (err: unknown) {
      console.error('File upload failed:', err);
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachment: ProjectAttachment) => {
    await attachmentService.deleteAttachment(attachment);
    const updated = (brief.attachments || []).filter((a) => a.fileId !== attachment.fileId);
    onChange({ attachments: updated });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          Additional details & reference attachments
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Share inspiration links, technical constraints, or relevant documents (briefs, RFPs, wireframes, style guides).
        </p>
      </div>

      {/* Free-text field */}
      <Textarea
        id="brief-additional-details"
        label="Special Requirements & Notes"
        placeholder="Anything else that would help us understand what you're looking for? (e.g. references to websites you admire, technical integrations, key competitors, or strict security needs)..."
        value={brief.additionalDetails || ''}
        onChange={(e) => onChange({ additionalDetails: e.target.value })}
        rows={4}
        helperText="Optional notes to ensure accurate matching."
      />

      {/* Attachments Section */}
      <div className="space-y-3 pt-6 border-t border-neutral-100">
        <div>
          <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1">
            Project Attachments (Optional)
          </label>
          <p className="text-xs text-neutral-500">
            Upload PDF, PNG, JPG, WEBP, DOCX, or ZIP files (up to 15MB each).
          </p>
        </div>

        {/* Drag & Drop target */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.zip"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 mb-3 shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs text-neutral-700 font-medium">
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-neutral-950 font-semibold underline cursor-pointer"
              >
                browse files
              </button>
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Max 15MB per file. Securely stored and accessible only to your project.
            </p>
          </div>
        </div>

        {/* Upload progress indicator */}
        {uploadProgress !== null && (
          <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200 text-xs">
            <div className="flex items-center justify-between mb-1 text-neutral-700 font-medium">
              <span>Uploading attachment…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Attached files list */}
        {(brief.attachments || []).length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-neutral-700">
              Uploaded Files ({(brief.attachments || []).length}):
            </div>
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden bg-white">
              {(brief.attachments || []).map((att) => (
                <div
                  key={att.fileId}
                  className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="font-medium text-neutral-900 truncate">
                      {att.name}
                    </span>
                    <span className="text-neutral-400 text-[11px] shrink-0">
                      ({formatFileSize(att.size)})
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(att)}
                    className="text-neutral-400 hover:text-rose-600 p-1 h-auto"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
