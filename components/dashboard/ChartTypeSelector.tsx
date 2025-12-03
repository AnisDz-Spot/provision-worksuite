"use client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ChartType = "line" | "bar" | "area" | "pie";

interface ChartTypeSelectorProps {
  currentType: ChartType;
  onTypeChange: (type: ChartType) => void;
  availableTypes: ChartType[];
}

const chartTypeLabels: Record<ChartType, string> = {
  line: "Line",
  bar: "Bar",
  area: "Area",
  pie: "Pie",
};

export function ChartTypeSelector({
  currentType,
  onTypeChange,
  availableTypes,
}: ChartTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {availableTypes.map((type) => (
        <Button
          key={type}
          onClick={() => onTypeChange(type)}
          variant="outline"
          size="sm"
          className={cn(
            "transition-colors",
            currentType === type
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:border-primary"
          )}
        >
          {chartTypeLabels[type]}
        </Button>
      ))}
    </div>
  );
}
