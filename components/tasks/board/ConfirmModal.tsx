"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "destructive" | "outline";
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}: ConfirmModalProps) {
  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()} size="sm">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground">{message}</div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
