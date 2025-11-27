'use client';

import { Gauge, Hourglass, ShieldCheck, Signal, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TransferJob } from "@/lib/stores/transferStore";

type SideStatsProps = {
  jobs: TransferJob[];
};

export const SideStats = ({ jobs }: SideStatsProps) => {

  const counts = jobs.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      if (job.priority === "boosted") acc.boosted += 1;
      acc.longestEta = Math.max(acc.longestEta, job.etaDays);
      acc.topThroughput = Math.max(acc.topThroughput, job.throughputMbps);
      return acc;
    },
    {
      active: 0,
      paused: 0,
      queued: 0,
      attention: 0,
      boosted: 0,
      longestEta: 0,
      topThroughput: 0,
    }
  );

  const speedPerDay = (counts.topThroughput / 8) * 0.001; // TB/day approx

  return (
    <Card className="monk-card sticky top-6 border-none bg-white/90">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Transfer Pulse
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          High-level health signals updated every 4 seconds.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <StatusRow icon={Signal} label="Active" value={`${counts.active} jobs`} />
          <StatusRow
            icon={ShieldCheck}
            label="Queued / Completed"
            value={`${counts.queued} archives`}
          />
          <StatusRow
            icon={Hourglass}
            label="Needs Review"
            value={`${counts.attention} facilities`}
            badge="Attention"
          />
          <StatusRow icon={Gauge} label="Paused" value={`${counts.paused} throttled`} />
        </section>

        <Separator />

        <section className="space-y-3">
          <StatusRow
            icon={Zap}
            label="Boosted lanes"
            value={`${counts.boosted} / ${jobs.length}`}
            sub={`${counts.boosted > 0 ? "Expediting urgent oncology loads" : "Idle"}`}
          />
          <div className="rounded-2xl bg-orange-50/80 p-4 text-sm leading-relaxed">
            <p className="text-xs uppercase tracking-widest text-orange-600">ETA</p>
            <p className="text-2xl font-semibold text-orange-700">
              {counts.longestEta} days
            </p>
            <p className="text-muted-foreground">
              Longest running ingest ({counts.longestEta}d) is trending down as boosted
              circuits stabilize.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4 text-sm text-white">
            <p className="text-xs uppercase tracking-widest text-white/80">Mesh Speed</p>
            <p className="text-2xl font-semibold">{counts.topThroughput} MB/s</p>
            <p className="text-white/80">
              ≈ {speedPerDay.toFixed(1)} TB/day on the fastest interconnect
            </p>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

type StatusRowProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  badge?: string;
};

const StatusRow = ({ icon: Icon, label, value, sub, badge }: StatusRowProps) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-orange-50 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-foreground">{value}</p>
      {badge && <p className="text-xs uppercase tracking-widest text-orange-600">{badge}</p>}
    </div>
  </div>
);

