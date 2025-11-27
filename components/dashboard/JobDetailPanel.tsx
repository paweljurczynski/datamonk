'use client';

import { Fragment, useMemo } from "react";
import { ActivitySquare, Clock3, Pause, Play, Route, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { TransferJob } from "@/lib/stores/transferStore";
import { cn } from "@/lib/utils";

type JobDetailPanelProps = {
  job?: TransferJob;
  onToggle: (jobId: string) => void;
  onBoost: (jobId: string) => void;
};

export const JobDetailPanel = ({ job, onToggle, onBoost }: JobDetailPanelProps) => {

  const progress = job ? Math.round((job.migratedTb / job.totalTb) * 100) : 0;
  const remaining = job ? Math.max(job.totalTb - job.migratedTb, 0) : 0;

  const timeline = useMemo(() => {
    if (!job) return [];
    return [
      {
        label: "Integrity Checks",
        detail: "Checksum validation across bundle 42",
        status: progress > 10 ? "complete" : "pending",
      },
      {
        label: "Mesh Transfer",
        detail: `${job.throughputMbps} MB/s sustained throughput`,
        status: progress > 45 ? "progress" : "pending",
      },
      {
        label: "Cold Archive Import",
        detail: `${job.etaDays} days remaining`,
        status: "pending",
      },
    ];
  }, [job, progress]);

  if (!job) {
    return (
      <Card className="monk-card border-none bg-white/90">
        <CardHeader>
          <CardTitle>No jobs available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select any job from the table to surface replication health, AI QA, and mesh
            throughput details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="monk-card border-none bg-white/90">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-2xl font-semibold text-foreground">
            {job.hospital}
          </CardTitle>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase text-orange-700">
            {job.priority} lane
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {job.modality} archive • {job.totalTb} TB dataset • {job.id}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Migrated</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-2 bg-orange-100" />
          <p className="mt-2 text-sm text-muted-foreground">
            {job.migratedTb.toFixed(1)} TB moved • {remaining.toFixed(1)} TB remaining
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoTile icon={ActivitySquare} label="Throughput" value={`${job.throughputMbps} MB/s`} />
          <InfoTile icon={Clock3} label="ETA" value={`${job.etaDays} days`} hint="Updated dynamically" />
          <InfoTile icon={Route} label="AI Confidence" value={`${job.aiConfidence}%`} hint="Needs review < 80%" />
          <InfoTile
            icon={Zap}
            label="Priority"
            value={job.priority === "boosted" ? "Boosted" : "Standard"}
            hint="Boost lanes run 40% hotter"
          />
        </section>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-orange-200 text-orange-700"
            onClick={() => onToggle(job.id)}
          >
            {job.status === "paused" ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
            {job.status === "paused" ? "Resume lane" : "Pause lane"}
          </Button>
          <Button
            className="bg-primary text-primary-foreground shadow-lg shadow-orange-200 hover:bg-orange-600"
            onClick={() => onBoost(job.id)}
          >
            <Zap className="mr-2 h-4 w-4" />
            Boost priority
          </Button>
        </div>

        <div className="rounded-2xl border border-dashed border-orange-200 p-4">
          <p className="text-xs uppercase tracking-widest text-orange-600">Live timeline</p>
          <div className="mt-4 space-y-4">
            {timeline.map((step, index) => (
              <Fragment key={`${step.label}-${index}`}>
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 rounded-full",
                      step.status === "complete"
                        ? "bg-emerald-500"
                        : step.status === "progress"
                        ? "bg-primary"
                        : "bg-slate-300"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
                {index !== timeline.length - 1 && <Separator className="border-dashed" />}
              </Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type InfoTileProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
};

const InfoTile = ({ icon: Icon, label, value, hint }: InfoTileProps) => (
  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
    <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

