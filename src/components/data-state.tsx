"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";

export function LoadingGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-4 ${className ?? "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function LoadingChart({ className }: { className?: string }) {
  return <Skeleton className={`h-72 w-full rounded-xl ${className ?? ""}`} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Ошибка загрузки</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>{message}</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RotateCw className="h-3.5 w-3.5" /> Повторить
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
