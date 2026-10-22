"use client";

import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "primary",
  isLoading = false,
  onConfirm,
}: ConfirmationModalProps) {
  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isDanger
                  ? "bg-[#FEE2E2] text-[#991B1B]"
                  : isWarning
                  ? "bg-[#FEF3C7] text-[#92400E]"
                  : "bg-[#F0FDFA] text-[#0F766E] border border-[#14B8A6]/30"
              }`}
            >
              {isDanger || isWarning ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>
            <DialogTitle className="text-base font-bold text-foreground">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left text-xs leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "destructive" : "default"}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
