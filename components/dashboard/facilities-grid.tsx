"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { Facility } from "@/types";

interface FacilitiesGridProps {
  facilities: Facility[];
}

export function FacilitiesGrid({ facilities }: FacilitiesGridProps) {
  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading text-base font-bold">
            Mạng Lưới Cơ Sở & Chi Nhánh Hoạt Động
          </CardTitle>
          <CardDescription>
            Hệ thống 1 Kho Trung Tâm, 1 Bếp Sơ Chế và 3 Nhà hàng trực thuộc DICA Group
          </CardDescription>
        </div>
        <Link href="/organization">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <span>Quản lý cơ sở</span>
            <ExternalLink className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-4 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium border-border/80 text-muted-foreground"
                  >
                    {fac.type === "CENTRAL_WAREHOUSE"
                      ? "KHO TRUNG TÂM"
                      : fac.type === "CENTRAL_KITCHEN"
                      ? "BẾP TRUNG TÂM"
                      : "CHI NHÁNH NHÀ HÀNG"}
                  </Badge>
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    {fac.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Mã: {fac.code}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {fac.address}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {fac.type === "BRANCH"
                    ? "3 Điểm kho & Bếp"
                    : "5 Phân khu lưu kho"}
                </span>
                <Link
                  href={`/inventory?facility=${fac.id}`}
                  className="text-foreground hover:underline font-medium flex items-center gap-0.5"
                >
                  <span>Xem tồn kho</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
