'use client';

import {
  Activity,
  BellRing,
  Bolt,
  CalendarClock,
  Info,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  completion: number;
  totalMigrated: number;
  avgThroughput: number;
  etaDays: number;
  retrainingActive: boolean;
  retrainCount: number;
};

export const AppHeader = ({
  completion,
  totalMigrated,
  avgThroughput,
  etaDays,
  retrainingActive,
  retrainCount,
}: AppHeaderProps) => {

  return (
    <header className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">
            DataMonk Ops Hub
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground">
            PACS Orchestration Command Center
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Monitoring 6 concurrent migrations across the network. Long-haul transfers run
            24/7 with live AI QA keeping radiologists in the loop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-orange-200 text-orange-700">
            <BellRing className="mr-2 h-4 w-4" />
            Alerts (3)
          </Button>
          <Button className="bg-primary text-primary-foreground shadow-lg shadow-orange-200 hover:bg-orange-600">
            <Bolt className="mr-2 h-4 w-4" />
            Boost Transfer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <HeaderStat
          icon={Activity}
          label="Completion"
          value={`${completion}%`}
          meta={`${totalMigrated.toFixed(0)} TB of history moved`}
        />
        <HeaderStat
          icon={CalendarClock}
          label="Fleet ETA"
          value={`${etaDays} days`}
          meta="Longest job ETA recalculated every tick"
        />
        <HeaderStat
          icon={RefreshCw}
          label="Throughput"
          value={`${avgThroughput} MB/s`}
          meta="Rolling 15 minute mean across the mesh"
        />
      </div>

      <Card className="monk-card border-none bg-gradient-to-r from-orange-50 to-white/60 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge
            className={cn(
              "bg-primary/10 text-primary",
              retrainingActive && "animate-pulse bg-primary text-white"
            )}
          >
            <Info className="mr-2 h-3.5 w-3.5" />
            {retrainingActive ? "Retraining..." : "Active Learning"}
          </Badge>
          <span>
            {retrainCount > 0
              ? `${retrainCount} manual confirmations have tightened the AI QA thresholds today.`
              : "Waiting for radiologist feedback to tune the QA thresholds."}
          </span>
        </div>
      </Card>
    </header>
  );
};

type HeaderStatProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  meta: string;
};

const HeaderStat = ({ icon: Icon, label, value, meta }: HeaderStatProps) => (
  <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground/80">{meta}</p>
  </div>
);

