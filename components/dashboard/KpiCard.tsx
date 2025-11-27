'use client';

import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiTrend = {
  direction: "up" | "down";
  value: string;
  label?: string;
};

type KpiCardProps = {
  title: string;
  value: string;
  meta?: string;
  trend?: KpiTrend;
  icon?: ReactNode;
  className?: string;
};

export const KpiCard = ({
  title,
  value,
  meta,
  trend,
  icon,
  className,
}: KpiCardProps) => {
  const TrendIcon = trend?.direction === "down" ? ArrowDownRight : ArrowUpRight;
  const trendColor =
    trend?.direction === "down"
      ? "text-red-500 bg-red-100/60"
      : "text-emerald-600 bg-emerald-100/70";

  return (
    <Card className={cn("monk-card border-none bg-card/90", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-6">
        <div>
          <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/80">
            {title}
          </CardDescription>
          <CardTitle className="text-3xl font-semibold text-foreground">
            {value}
          </CardTitle>
        </div>
        {icon && (
          <div className="rounded-full bg-orange-100/70 p-3 text-primary shadow-inner">
            {icon}
          </div>
        )}
      </CardHeader>
      {(trend || meta) && (
        <CardContent className="flex items-center justify-between pb-6 pt-0 text-sm text-muted-foreground">
          {meta && <span>{meta}</span>}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                trendColor
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {trend.value}
              {trend.label && <span className="text-muted-foreground/80">{trend.label}</span>}
            </span>
          )}
        </CardContent>
      )}
    </Card>
  );
};

