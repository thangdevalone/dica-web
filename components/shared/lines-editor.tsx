"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/shared/entity-select";
import { OptionSelect } from "@/components/shared/form";
import { useIngredients, useUnits } from "@/hooks/use-lookups";
import type { Ingredient } from "@/lib/api/types";
import { QUANTITY_PATTERN } from "@/lib/num";

export interface LineDraft {
  key: string;
  ingredient_id: string;
  unit_id: string;
  quantity: string;
  note: string;
}

let seq = 0;
export function newLine(partial?: Partial<Omit<LineDraft, "key">>): LineDraft {
  seq += 1;
  return { key: `l${Date.now()}-${seq}`, ingredient_id: "", unit_id: "", quantity: "", note: "", ...partial };
}

const SIGNED_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;

/** Kiểm tra danh sách dòng; trả về thông báo lỗi tiếng Việt hoặc null nếu hợp lệ. */
export function validateLines(
  lines: LineDraft[],
  opts: { withUnit?: boolean; allowNegative?: boolean; allowZero?: boolean } = {}
): string | null {
  if (lines.length === 0) return "Cần ít nhất một dòng nguyên liệu.";
  const seen = new Set<string>();
  for (const [i, line] of lines.entries()) {
    const n = i + 1;
    if (!line.ingredient_id) return `Dòng ${n}: chưa chọn nguyên liệu.`;
    if (seen.has(line.ingredient_id)) return `Dòng ${n}: nguyên liệu bị trùng.`;
    seen.add(line.ingredient_id);
    if (opts.withUnit && !line.unit_id) return `Dòng ${n}: chưa chọn đơn vị.`;
    const q = line.quantity.trim().replace(",", ".");
    if (!(opts.allowNegative ? SIGNED_PATTERN : QUANTITY_PATTERN).test(q))
      return `Dòng ${n}: số lượng không hợp lệ (tối đa 3 chữ số thập phân).`;
    if (!opts.allowZero && Number(q) === 0) return `Dòng ${n}: số lượng phải khác 0.`;
  }
  return null;
}

export function cleanQty(value: string) {
  return value.trim().replace(",", ".");
}

/** Bảng nhập dòng nguyên liệu dùng cho yêu cầu, điều chuyển, kiểm kê, báo hỏng. */
export function LinesEditor({
  lines,
  onChange,
  withUnit,
  withNote,
  quantityLabel = "Số lượng",
  noteLabel = "Ghi chú",
  allowedIngredientIds,
  emptyHint,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  withUnit?: boolean;
  withNote?: boolean;
  quantityLabel?: string;
  noteLabel?: string;
  /** Giới hạn nguyên liệu được chọn (vd. theo cấu hình được phép xin). `null` = không giới hạn. */
  allowedIngredientIds?: Set<string> | null;
  emptyHint?: string;
}) {
  const { data: ingredients = [] } = useIngredients();
  const { data: units = [] } = useUnits();
  const byId = React.useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const options = React.useMemo(
    () =>
      ingredients
        .filter((i) => i.active && (!allowedIngredientIds || allowedIngredientIds.has(i.id)))
        .map((i) => ({ value: i.id, label: i.name, hint: `${i.code}${i.baseUnit ? ` · ${i.baseUnit.code}` : ""}` })),
    [ingredients, allowedIngredientIds]
  );
  const unitOptions = React.useMemo(
    () => units.filter((u) => u.active).map((u) => ({ value: u.id, label: u.name, hint: u.code })),
    [units]
  );

  const update = (key: string, patch: Partial<LineDraft>) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const pickIngredient = (key: string, id: string) => {
    const ingredient: Ingredient | undefined = byId.get(id);
    update(key, { ingredient_id: id, ...(withUnit && ingredient ? { unit_id: ingredient.baseUnitId } : {}) });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-muted/30">
            <tr className="text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-2 py-2">Nguyên liệu</th>
              {withUnit && <th className="w-36 px-2 py-2">Đơn vị</th>}
              <th className="w-32 px-2 py-2">{quantityLabel}</th>
              {withNote && <th className="w-44 px-2 py-2">{noteLabel}</th>}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const ingredient = byId.get(line.ingredient_id);
              return (
                <tr key={line.key} className="border-t border-border/60">
                  <td className="px-2 py-1.5">
                    <Combobox
                      value={line.ingredient_id}
                      onChange={(id) => pickIngredient(line.key, id)}
                      options={
                        ingredient && !options.some((o) => o.value === ingredient.id)
                          ? [...options, { value: ingredient.id, label: ingredient.name, hint: ingredient.code }]
                          : options
                      }
                      placeholder="Chọn nguyên liệu"
                      searchPlaceholder="Tìm theo tên hoặc mã..."
                    />
                  </td>
                  {withUnit && (
                    <td className="px-2 py-1.5">
                      <OptionSelect
                        value={line.unit_id}
                        onChange={(unit_id) => update(line.key, { unit_id })}
                        options={unitOptions}
                        placeholder="Đơn vị"
                      />
                    </td>
                  )}
                  <td className="px-2 py-1.5">
                    <div className="relative">
                      <Input
                        value={line.quantity}
                        onChange={(e) => update(line.key, { quantity: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        className="h-9 pr-12 text-xs"
                      />
                      {!withUnit && ingredient?.baseUnit && (
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          {ingredient.baseUnit.code}
                        </span>
                      )}
                    </div>
                  </td>
                  {withNote && (
                    <td className="px-2 py-1.5">
                      <Input
                        value={line.note}
                        onChange={(e) => update(line.key, { note: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Xoá dòng"
                      onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  {emptyHint ?? "Chưa có dòng nào. Bấm “Thêm dòng” để bắt đầu."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onChange([...lines, newLine()])}>
          <Plus className="size-3.5" /> Thêm dòng
        </Button>
        <span className="text-[11px] text-muted-foreground">{lines.length} dòng</span>
      </div>
    </div>
  );
}
