'use client';

import { useMemo } from "react";
import { ArrowUpRight, Pause, Play, Rocket } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransferJob } from "@/lib/stores/transferStore";

type TransferTableProps = {
  jobs: TransferJob[];
  selectedJobId?: string;
  onSelect: (jobId: string) => void;
  onToggle: (jobId: string) => void;
  onBoost: (jobId: string) => void;
};

export const TransferTable = ({
  jobs,
  selectedJobId,
  onSelect,
  onToggle,
  onBoost,
}: TransferTableProps) => {

  const sortedJobs = useMemo(
    () =>
      [...jobs].sort((a, b) => {
        if (a.status === "attention" && b.status !== "attention") return -1;
        if (b.status === "attention" && a.status !== "attention") return 1;
        return b.throughputMbps - a.throughputMbps;
      }),
    [jobs]
  );

  return (
    <div className="rounded-3xl border border-border/60 bg-white/95 p-6 shadow-xl shadow-orange-200/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Transfers
          </p>
          <h3 className="text-2xl font-semibold text-foreground">Live ingest mesh</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:bg-orange-50">
          Export snapshot
          <ArrowUpRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 monk-scroll max-h-[420px] pr-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 text-xs uppercase tracking-wide">
              <TableHead>Facility / Modality</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>AI QA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJobs.map((job) => {
              const pct = Math.round((job.migratedTb / job.totalTb) * 100);
              const statusBadge = getStatusBadge(job.status);
              return (
                <TableRow
                  key={job.id}
                  data-state={selectedJobId === job.id ? "selected" : undefined}
                  className="cursor-pointer rounded-xl border-none"
                  onClick={() => onSelect(job.id)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{job.hospital}</span>
                      <span className="text-xs text-muted-foreground">
                        {job.modality} • {job.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[220px]">
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="h-1.5 flex-1 bg-orange-100" />
                      <span className="text-sm font-semibold">{pct}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {job.migratedTb.toFixed(0)} / {job.totalTb} TB
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{job.throughputMbps} MB/s</p>
                    <p className="text-xs text-muted-foreground">
                      Priority: {job.priority === "boosted" ? "Boosted" : "Standard"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-semibold text-foreground">{job.etaDays} days</span>
                      <span className="text-xs text-muted-foreground">auto recalculated</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-xs font-semibold",
                        job.aiConfidence < 78
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {job.aiConfidence}% confidence
                    </Badge>
                    <div className="mt-1">{statusBadge}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggle(job.id);
                        }}
                      >
                        {job.status === "paused" ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          job.priority === "boosted" ? "text-primary" : "text-muted-foreground"
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          onBoost(job.id);
                        }}
                      >
                        <Rocket className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  const base =
    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
  switch (status) {
    case "attention":
      return <span className={cn(base, "bg-red-100 text-red-700")}>Needs review</span>;
    case "paused":
      return <span className={cn(base, "bg-slate-100 text-slate-600")}>Paused</span>;
    case "queued":
      return <span className={cn(base, "bg-emerald-50 text-emerald-700")}>Queued</span>;
    default:
      return <span className={cn(base, "bg-orange-100 text-orange-700")}>Active</span>;
  }
};

