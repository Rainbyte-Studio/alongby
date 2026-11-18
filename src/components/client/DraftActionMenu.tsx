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
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 border border-transparent hover:border-neutral-200 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-1.5 w-44 origin-top-right rounded-lg bg-white shadow-lg border border-neutral-200 py-1 z-30 focus:outline-none text-xs"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenRename}
              className="w-full px-3.5 py-2 text-left text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
              <span>Rename Draft</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenDelete}
              className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-neutral-100"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
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
        <form onSubmit={handleSaveRename} className="p-6 space-y-4">
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

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
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
        <div className="p-6 space-y-4">
          {deleteError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <span className="font-semibold text-neutral-900 block truncate">
              {project.title || 'Untitled Project Brief'}
            </span>
            <span className="text-neutral-500 block mt-0.5">
              Status: Draft in progress
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
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
