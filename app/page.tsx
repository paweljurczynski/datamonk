'use client';

import { useMemo, useState, useEffect } from "react";
import { ShieldAlert, Sparkles, Timer } from "lucide-react";

import { AppHeader } from "@/components/dashboard/AppHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SideStats } from "@/components/dashboard/SideStats";
import { TransferTable } from "@/components/dashboard/TransferTable";
import { JobDetailPanel } from "@/components/dashboard/JobDetailPanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { MOCK_JOBS, MOCK_REVIEWS, MOCK_TREND, type ReviewWithLabel } from "@/lib/mocks/transfer";
import type { TransferJob } from "@/lib/stores/transferStore";

const computeKpis = (jobs: TransferJob[]) => {
  const totalMigrated = jobs.reduce((sum, job) => sum + job.migratedTb, 0);
  const totalPlanned = jobs.reduce((sum, job) => sum + job.totalTb, 0);
  const avgThroughput =
    jobs.reduce((sum, job) => sum + job.throughputMbps, 0) / Math.max(1, jobs.length);
  const weightedEta =
    jobs.reduce((sum, job) => sum + job.etaDays * job.totalTb, 0) / Math.max(1, totalPlanned);

  return {
    completion: Math.round((totalMigrated / Math.max(1, totalPlanned)) * 100),
    totalMigrated,
    avgThroughput: Math.round(avgThroughput),
    etaDays: Math.max(1, Math.round(weightedEta)),
  };
};

export default function Home() {
  const [jobs, setJobs] = useState<TransferJob[]>(MOCK_JOBS);
  const [reviews, setReviews] = useState<ReviewWithLabel[]>(MOCK_REVIEWS);
  const [selectedJob, setSelectedJob] = useState<string>(MOCK_JOBS[0]?.id);
  const [retrainCount, setRetrainCount] = useState(0);
  const [retrainingActive, setRetrainingActive] = useState(false);

  const { completion, totalMigrated, avgThroughput, etaDays } = useMemo(
    () => computeKpis(jobs),
    [jobs]
  );

  const aiConfidence = useMemo(() => {
    if (!jobs.length) return 0;
    return Math.round(jobs.reduce((sum, job) => sum + job.aiConfidence, 0) / jobs.length);
  }, [jobs]);

  const pendingReviews = reviews.filter((rev) => rev.status === "pending").length;

  useEffect(() => {
    if (!retrainingActive) return;
    const timer = window.setTimeout(() => setRetrainingActive(false), 2400);
    return () => window.clearTimeout(timer);
  }, [retrainingActive]);

  const handleToggleJob = (id: string) =>
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? {
              ...job,
              status: job.status === "paused" ? "active" : "paused",
            }
          : job
      )
    );

  const handleBoostJob = (id: string) =>
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? {
              ...job,
              priority: "boosted",
              throughputMbps: Math.min(1200, Math.round(job.throughputMbps * 1.15)),
            }
          : job
      )
    );

  const handleReviewDecision = (id: string, decision: "approved" | "rejected") => {
    const review = reviews.find((rev) => rev.id === id);
    if (!review) return;

    setReviews((prev) =>
      prev.map((rev) => (rev.id === id ? { ...rev, status: decision } : rev))
    );

    setJobs((prev) =>
      prev.map((job) =>
        job.id === review.jobId
          ? {
              ...job,
              aiConfidence: Math.min(99, job.aiConfidence + (decision === "approved" ? 6 : -4)),
              status: decision === "approved" ? "active" : "attention",
            }
          : job
      )
    );

    setRetrainCount((count) => count + 1);
    setRetrainingActive(true);
  };

  const currentJob = jobs.find((job) => job.id === selectedJob) ?? jobs[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,160,88,0.18),_transparent_50%),#fdf8f3]">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-10 lg:flex-row lg:px-10">
        <div className="flex-1 space-y-6">
          <AppHeader
            completion={completion}
            totalMigrated={totalMigrated}
            avgThroughput={avgThroughput}
            etaDays={etaDays}
            retrainingActive={retrainingActive}
            retrainCount={retrainCount}
          />

          <section className="monk-grid">
            <KpiCard
              title="Jobs Online"
              value={`${jobs.length} ingest streams`}
              meta="Across 12 facilities"
              icon={<Timer className="h-5 w-5" />}
              trend={{
                direction: "up",
                value: "+3",
                label: "vs last week",
              }}
            />
            <KpiCard
              title="AI Confidence"
              value={`${aiConfidence}%`}
              meta="Auto triage threshold 80%"
              icon={<Sparkles className="h-5 w-5" />}
              trend={{
                direction: aiConfidence >= 85 ? "up" : "down",
                value: `${aiConfidence >= 85 ? "+" : "-"}${Math.abs(aiConfidence - 85)}%`,
                label: "vs target",
              }}
            />
            <KpiCard
              title="Needs Review"
              value={`${pendingReviews} scans`}
              meta="Long-haul QA queue"
              icon={<ShieldAlert className="h-5 w-5" />}
              trend={{
                direction: "down",
                value: "-12%",
                label: "since midnight",
              }}
            />
          </section>

          <section>
            <TransferTable
              jobs={jobs}
              selectedJobId={selectedJob}
              onSelect={setSelectedJob}
              onToggle={handleToggleJob}
              onBoost={handleBoostJob}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <JobDetailPanel job={currentJob} onToggle={handleToggleJob} onBoost={handleBoostJob} />
            <ReviewQueue
              reviews={reviews}
              confidenceTrend={MOCK_TREND}
              onDecision={handleReviewDecision}
            />
          </section>
        </div>
        <aside className="lg:w-[320px]">
          <SideStats jobs={jobs} />
        </aside>
      </main>
    </div>
  );
}
