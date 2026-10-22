"use client";

import * as React from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PermissionRequest } from "@/types";

export interface PermissionReviewModalProps {
  permission: PermissionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes?: string) => void;
}

export function PermissionReviewModal({
  permission,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: PermissionReviewModalProps) {
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!permission) return null;

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onApprove(permission.id, reviewNotes);
      setIsSubmitting(false);
      onOpenChange(false);
    }, 400);
  };

  const handleReject = () => {
    if (!reviewNotes) {
      alert("Harap tuliskan catatan alasan penolakan perizinan.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onReject(permission.id, reviewNotes);
      setIsSubmitting(false);
      onOpenChange(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base">
                Verifikasi Surat Permohonan Izin
              </DialogTitle>
              <DialogDescription className="text-xs">
                {permission.studentName} ({permission.className})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 border border-border">
            <div>
              <span className="text-muted-foreground">Jenis Izin:</span>
              <p className="font-semibold text-foreground mt-0.5">
                {permission.type}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Durasi:</span>
              <p className="font-semibold text-foreground mt-0.5">
                {permission.totalDays} Hari ({permission.startDate} s/d {permission.endDate})
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-1">
            <span className="text-muted-foreground font-medium">Alasan Pengajuan:</span>
            <p className="text-foreground leading-relaxed mt-1">
              {permission.reason}
            </p>
          </div>

          {permission.attachmentName && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">
                  {permission.attachmentName}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => alert(`Mengunduh dokumen lampiran: ${permission.attachmentName}`)}
              >
                Lihat Lampiran
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Catatan Verifikator (Wali Kelas / BK / Petugas Piket):
            </label>
            <Textarea
              placeholder="Tuliskan catatan verifikasi izin..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="text-xs"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
            className="gap-1 text-xs"
          >
            <XCircle className="h-3.5 w-3.5" />
            Tolak Izin
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={handleApprove}
            isLoading={isSubmitting}
            className="gap-1 text-xs"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Setujui Izin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
