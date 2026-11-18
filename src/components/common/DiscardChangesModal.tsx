import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface DiscardChangesModalProps {
  isOpen: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export const DiscardChangesModal: React.FC<DiscardChangesModalProps> = ({
  isOpen,
  onKeepEditing,
  onDiscard,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onKeepEditing}
      title="Discard changes?"
      description="Your unsaved profile changes will be lost."
      maxWidth="sm"
    >
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
        <Button
          id="confirm-keep-editing-btn"
          type="button"
          variant="outline"
          size="sm"
          onClick={onKeepEditing}
          className="w-full sm:w-auto"
        >
          Keep Editing
        </Button>
        <Button
          id="confirm-discard-changes-btn"
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDiscard}
          className="w-full sm:w-auto"
        >
          Discard Changes
        </Button>
      </div>
    </Modal>
  );
};
