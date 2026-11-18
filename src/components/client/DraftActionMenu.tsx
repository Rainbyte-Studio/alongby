import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface DraftActionMenuProps {
  project: Project;
  onRenamed: (newTitle: string) => void;
  onDeleted: () => void;
  className?: string;
}

export const DraftActionMenu: React.FC<DraftActionMenuProps> = ({
  project,
  onRenamed,
  onDeleted,
  className = '',
}) => {
  const { userProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Rename state
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(project.title || '');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  // Keep draftTitle synced if project title changes
  useEffect(() => {
    setDraftTitle(project.title || '');
  }, [project.title]);

  // Handle open rename dialog
  const handleOpenRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setDraftTitle(project.title || '');
    setRenameError(null);
    setIsRenameOpen(true);
  };

  // Handle open delete dialog
  const handleOpenDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  // Execute rename
  const handleSaveRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userProfile?.id || isRenaming) return;

    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed.length < 3) {
      setRenameError('Project title must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 120) {
      setRenameError('Project title cannot exceed 120 characters.');
      return;
    }

    try {
      setIsRenaming(true);
      setRenameError(null);
      await projectService.renameDraft(project.id, trimmed, userProfile.id);
      setIsRenameOpen(false);
      onRenamed(trimmed);
    } catch (err: any) {
      console.error('Failed to rename draft:', err);
      setRenameError(
        err?.message || 'Failed to rename project draft. Please try again.'
      );
    } finally {
      setIsRenaming(false);
    }
  };

  // Execute delete
  const handleConfirmDelete = async () => {
    if (!userProfile?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await projectService.deleteDraft(project.id, userProfile.id);
      setIsDeleteOpen(false);
      onDeleted();
    } catch (err: any) {
      console.error('Failed to delete draft:', err);
      // User-friendly error mapping, avoid raw Firebase errors
      const msg = err?.message || 'Unable to delete project draft. Please try again.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label="Draft options"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          className="p-2 rounded-[var(--radius-button)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] border border-transparent hover:border-[var(--color-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-1.5 w-44 origin-top-right rounded-[var(--radius-button)] bg-[var(--color-surface)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] py-1 z-30 focus:outline-none text-[13px] font-medium"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenRename}
              className="w-full px-3.5 py-2 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              <span>Rename Draft</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenDelete}
              className="w-full px-3.5 py-2 text-left text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] flex items-center gap-2 transition-colors cursor-pointer border-t border-[var(--color-border)]"
            >
              <Trash2 className="w-3.5 h-3.5 text-[var(--color-error)]" />
              <span>Delete Draft</span>
            </button>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Modal
        isOpen={isRenameOpen}
        onClose={() => {
          if (!isRenaming) setIsRenameOpen(false);
        }}
        title="Rename draft"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveRename} className="space-y-4">
          <Input
            id={`rename-draft-${project.id}`}
            label="Project Name"
            value={draftTitle}
            onChange={(e) => {
              setDraftTitle(e.target.value);
              if (renameError) setRenameError(null);
            }}
            placeholder="Enter draft title"
            autoFocus
            required
            error={renameError || undefined}
            disabled={isRenaming}
            helperText="Provide a clear, descriptive name (3–120 characters)."
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRenameOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isRenaming}
              disabled={isRenaming || !draftTitle.trim()}
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteOpen(false);
        }}
        title="Delete this draft?"
        description="This draft and its saved project brief will be permanently deleted. This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 rounded-[var(--radius-button)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error-text)] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="text-[13px] text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)] border border-[var(--color-border)]">
            <span className="font-semibold text-[var(--color-text-primary)] block truncate">
              {project.title || 'Untitled Project Brief'}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] block mt-0.5">
              Status: Draft in progress
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              isLoading={isDeleting}
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Draft
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
