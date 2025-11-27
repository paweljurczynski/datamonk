'use client';

import { create } from "zustand";

type JobStatus = "active" | "paused" | "queued" | "attention";

export type TransferJob = {
  id: string;
  hospital: string;
  modality: string;
  totalTb: number;
  migratedTb: number;
  throughputMbps: number;
  etaDays: number;
  aiConfidence: number;
  status: JobStatus;
  priority: "standard" | "boosted";
  lastUpdated: number;
};

export type ScanReview = {
  id: string;
  jobId: string;
  patientId: string;
  modality: string;
  confidence: number;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
};

export type TrendPoint = {
  timestamp: number;
  confidence: number;
};

const facilities = [
  "St. Jude Heart Institute",
  "Northwind Oncology",
  "Providence Imaging Center",
  "Mercy General",
  "Alta Neuroscience",
  "Sunrise Pediatrics",
];

const modalities = ["CT", "MRI", "PET", "XRAY", "Mammo", "US"];

const createSeededRandom = (seed: number) => {
  return () => {
    // mulberry32
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seededRandom = createSeededRandom(0xfeed2025);

const seededRandomBetween = (min: number, max: number) =>
  seededRandom() * (max - min) + min;

const runtimeRandomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const INITIAL_TIMESTAMP = Date.UTC(2025, 0, 2, 8, 0, 0); // deterministic base for SSR

const seedJobs = (): TransferJob[] => {
  return Array.from({ length: 6 }, (_, idx) => {
    const totalTb = Math.round(seededRandomBetween(180, 520));
    const migrated = Math.round(totalTb * seededRandomBetween(0.15, 0.82));
    const status: JobStatus = idx === 0 ? "attention" : "active";
    return {
      id: `JOB-${2400 + idx}`,
      hospital: facilities[idx],
      modality: modalities[idx % modalities.length],
      totalTb,
      migratedTb: migrated,
      throughputMbps: Math.round(seededRandomBetween(480, 980)),
      etaDays: Math.round(seededRandomBetween(8, 22)),
      aiConfidence: Math.round(seededRandomBetween(70, 96)),
      status,
      priority: idx % 3 === 0 ? "boosted" : "standard",
      lastUpdated: INITIAL_TIMESTAMP,
    };
  });
};

const seedReviews = (jobs: TransferJob[]): ScanReview[] => {
  return jobs
    .filter((job) => job.aiConfidence < 82)
    .map((job, idx) => ({
      id: `REV-${idx + 1}`,
      jobId: job.id,
      patientId: `PT-${700 + idx}`,
      modality: job.modality,
      confidence: job.aiConfidence - seededRandomBetween(3, 10),
      createdAt: INITIAL_TIMESTAMP - idx * 1000 * 60 * 45,
      status: "pending" as const,
    }));
};

const computeKpis = (jobs: TransferJob[]) => {
  const totalMigrated = jobs.reduce((sum, job) => sum + job.migratedTb, 0);
  const totalPlanned = jobs.reduce((sum, job) => sum + job.totalTb, 0);
  const avgThroughput =
    jobs.reduce((sum, job) => sum + job.throughputMbps, 0) / jobs.length;
  const weightedEta =
    jobs.reduce((sum, job) => sum + job.etaDays * job.totalTb, 0) /
    totalPlanned;

  return {
    completion: Math.round((totalMigrated / totalPlanned) * 100) || 0,
    totalMigrated,
    avgThroughput: Math.round(avgThroughput),
    etaDays: Math.max(1, Math.round(weightedEta)),
  };
};

export type TransferState = ReturnType<typeof hydrateState> & {
  startSimulation: () => void;
  toggleJob: (id: string) => void;
  boostJob: (id: string) => void;
  approveReview: (id: string, decision: "approved" | "rejected") => void;
};

function hydrateState() {
  const jobs = seedJobs();
  return {
    jobs,
    reviews: seedReviews(jobs),
    confidenceTrend: generateTrend(),
    retrainCount: 0,
    retrainingActive: false,
    hasStarted: false,
    ...computeKpis(jobs),
  };
}

const generateTrend = (): TrendPoint[] => {
  const now = INITIAL_TIMESTAMP;
  return Array.from({ length: 12 }, (_, idx) => {
    const timestamp = now - (11 - idx) * 1000 * 60 * 10;
    const confidence = Math.max(
      62,
      Math.min(99, 88 + Math.sin(idx / 2) * 6 + seededRandomBetween(-3, 3))
    );
    return { timestamp, confidence };
  });
};

let jobTimer: number | null = null;
let confidenceTimer: number | null = null;

export const useTransferStore = create<TransferState>((set, get) => ({
  ...hydrateState(),
  startSimulation: () => {
    if (get().hasStarted || typeof window === "undefined") return;
    set({ hasStarted: true });

    jobTimer = window.setInterval(() => {
      const { jobs } = get();
      const updatedJobs = jobs.map((job) => {
        if (job.status === "paused") return job;

        const drift = runtimeRandomBetween(-18, 22);
        const throughput = Math.max(220, job.throughputMbps + drift);
        const delta = (throughput / 8_000) * (job.priority === "boosted" ? 1.4 : 1); // TB per tick
        const migratedTb = Math.min(job.totalTb, job.migratedTb + delta);
        const etaDays = Math.max(
          1,
          Math.round(((job.totalTb - migratedTb) / job.totalTb) * job.etaDays)
        );

        let status = job.status;
        if (migratedTb >= job.totalTb) {
          status = "queued";
        } else if (job.aiConfidence < 78) {
          status = "attention";
        } else if (status === "queued") {
          status = "active";
        }

        const aiConfidence = Math.max(
          60,
          Math.min(
            98,
            job.aiConfidence +
              runtimeRandomBetween(-1.6, 1.2) -
              (status === "attention" ? 0.4 : 0)
          )
        );

        return {
          ...job,
          migratedTb,
          throughputMbps: Math.round(throughput),
          etaDays,
          status,
          aiConfidence,
          lastUpdated: Date.now(),
        };
      });

      set({
        jobs: updatedJobs,
        ...computeKpis(updatedJobs),
      });

      maybeQueueReview(updatedJobs, set, get);
    }, 3800);

    confidenceTimer = window.setInterval(() => {
      const trend = get().confidenceTrend.slice(-11);
      const nextPoint: TrendPoint = {
        timestamp: Date.now(),
        confidence: Math.max(
          63,
          Math.min(
            99,
            trend[trend.length - 1]?.confidence + runtimeRandomBetween(-2, 2)
          )
        ),
      };
      set({
        confidenceTrend: [...trend, nextPoint],
      });
    }, 60000);
  },
  toggleJob: (id: string) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              status: job.status === "paused" ? "active" : "paused",
            }
          : job
      ),
    })),
  boostJob: (id: string) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              priority: "boosted",
              throughputMbps: Math.round(job.throughputMbps * 1.2),
            }
          : job
      ),
    })),
  approveReview: (id: string, decision: "approved" | "rejected") => {
    const { reviews, jobs } = get();
    const review = reviews.find((rev) => rev.id === id);
    if (!review) return;

    const updatedReviews = reviews.map((rev) =>
      rev.id === id ? { ...rev, status: decision } : rev
    );

    const updatedJobs = jobs.map((job) =>
      job.id === review.jobId
        ? {
            ...job,
            aiConfidence: Math.min(99, job.aiConfidence + 6),
            status: decision === "approved" ? "active" : "attention",
          }
        : job
    );

    set({
      reviews: updatedReviews,
      jobs: updatedJobs,
      retrainCount: get().retrainCount + 1,
      retrainingActive: true,
      ...computeKpis(updatedJobs),
    });

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set({ retrainingActive: false });
      }, 2400);
    } else {
      set({ retrainingActive: false });
    }
  },
}));

type Setter = (fn: (state: TransferState) => TransferState | Partial<TransferState>) => void;

const maybeQueueReview = (jobs: TransferJob[], set: Setter, get: () => TransferState) => {
  const attentionJob = jobs.find(
    (job) => job.aiConfidence < 78 && !get().reviews.some((rev) => rev.jobId === job.id)
  );

  if (!attentionJob || Math.random() > 0.65) return;

  const nextReview: ScanReview = {
    id: `REV-${Math.round(Math.random() * 9000)}`,
    jobId: attentionJob.id,
    patientId: `PT-${Math.round(Math.random() * 9000)}`,
    modality: attentionJob.modality,
    confidence: attentionJob.aiConfidence - runtimeRandomBetween(2, 6),
    createdAt: Date.now(),
    status: "pending",
  };

  set((state) => ({
    reviews: [nextReview, ...state.reviews].slice(0, 6),
  }));
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (jobTimer) window.clearInterval(jobTimer);
    if (confidenceTimer) window.clearInterval(confidenceTimer);
  });
}

