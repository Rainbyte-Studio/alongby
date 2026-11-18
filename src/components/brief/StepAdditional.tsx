import React, { useState } from 'react';
import { ProjectBrief, ProjectAttachment } from '../../types';
import { attachmentService } from '../../services/attachmentService';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '../ui/FileUpload';

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
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    const attachment = (brief.attachments || []).find((a) => a.fileId === fileId);
    if (!attachment) return;
    await attachmentService.deleteAttachment(attachment);
    const updated = (brief.attachments || []).filter((a) => a.fileId !== fileId);
    onChange({ attachments: updated });
  };

  const uploadedItems = (brief.attachments || []).map((att) => ({
    id: att.fileId,
    name: att.name,
    size: att.size,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          Additional details &amp; reference attachments
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
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

      {/* Standardized Attachments Section */}
      <div className="pt-6 border-t border-[var(--color-border)]">
        <FileUpload
          label="Project Attachments (Optional)"
          helperText="Upload PDF, PNG, JPG, WEBP, DOCX, or ZIP files (up to 15MB each)."
          sublabel="Max 15MB per file. Securely stored and accessible only to your project."
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.zip"
          multiple
          progress={uploadProgress}
          error={uploadError}
          files={uploadedItems}
          onSelectFiles={handleFiles}
          onRemoveFile={handleRemoveFile}
        />
      </div>
    </div>
  );
};
