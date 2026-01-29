"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmLogoutModal({
  isOpen,
  onCancel,
  onConfirm,
}: ConfirmLogoutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Confirm Logout" size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">
          Are you sure you want to logout? You will need to sign in again to
          continue.
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-500"
            onClick={onConfirm}
          >
            Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
