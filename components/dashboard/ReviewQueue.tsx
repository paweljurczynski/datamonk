'use client';

import { useMemo } from "react";
import { CheckCircle2, TriangleAlert, XOctagon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TrendPoint } from "@/lib/stores/transferStore";
import type { ReviewWithLabel } from "@/lib/mocks/transfer";

type ReviewQueueProps = {
  reviews: ReviewWithLabel[];
  confidenceTrend: TrendPoint[];
  onDecision: (id: string, decision: "approved" | "rejected") => void;
};

export const ReviewQueue = ({ reviews, confidenceTrend, onDecision }: ReviewQueueProps) => {

  const pending = reviews.filter((review) => review.status === "pending");

  const trendPath = useMemo(() => {
    if (!confidenceTrend.length) return "";
    const max = 100;
    const min = 60;
    return confidenceTrend
      .map((point, idx) => {
        const x = (idx / (confidenceTrend.length - 1)) * 100;
        const y = ((max - point.confidence) / (max - min)) * 40;
        return `${x},${y}`;
      })
      .join(" ");
  }, [confidenceTrend]);

  return (
    <Card className="monk-card border-none bg-white/90">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            Active Learning
          </p>
          <CardTitle className="mt-1 text-2xl">Needs human review</CardTitle>
          <p className="text-sm text-muted-foreground">
            Low-confidence scans move here for radiologist confirmation. Approvals
            tighten the QA threshold instantly.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary">
          {pending.length} pending
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-dashed border-orange-200 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Confidence trend
          </p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-foreground">
                {confidenceTrend.at(-1)?.confidence ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground">Last 2 hours</p>
            </div>
            <svg viewBox="0 0 100 40" className="h-16 w-36 text-primary">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                points={trendPath}
              />
            </svg>
          </div>
        </div>

        <Separator />

        <div className="space-y-4 monk-scroll max-h-[360px] pr-2">
          {pending.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 px-6 py-12 text-center">
              <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" />
              <p className="font-medium text-foreground">Queue is clear</p>
              <p className="text-sm text-muted-foreground">
                AI confidence is holding above 90%. We will notify you if new scans need
                review.
              </p>
            </div>
          )}
          {pending.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {review.patientId} — {review.modality}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.jobId} • {review.createdAgoLabel}
                  </p>
                </div>
                <Badge className="bg-red-100 text-red-700">
                  {review.confidence.toFixed(0)}% confidence
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                AI flagged subtle tissue density shift below the 80% certainty threshold.
                Please confirm if the anomaly is actionable.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-orange-600"
                  onClick={() => onDecision(review.id, "approved")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-100 text-red-600 hover:bg-red-50"
                  onClick={() => onDecision(review.id, "rejected")}
                >
                  <XOctagon className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-sm text-white">
          <TriangleAlert className="h-5 w-5 text-orange-300" />
          <p>
            Manual decisions retrain the QA model every ~3 approvals. Expect the
            threshold to tighten within 30 seconds.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

