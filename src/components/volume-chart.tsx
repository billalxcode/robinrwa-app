"use client";

import { AreaSeries, ColorType, createChart } from "lightweight-charts";
import { useEffect, useRef } from "react";

export interface VolumePoint {
  time: string;
  value: number;
}

// Dok: /tradingview/lightweight-charts — createChart + addSeries(AreaSeries)
// + chart.remove() on cleanup. Colors follow the app design system.
export function VolumeChart({ data }: { data: VolumePoint[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || data.length === 0) return;
    const chart = createChart(el, {
      width: el.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b6259",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(42, 42, 41, 0.08)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#af7a4e",
      topColor: "rgba(175, 122, 78, 0.35)",
      bottomColor: "rgba(175, 122, 78, 0.0)",
      lineWidth: 2,
    });
    series.setData(data);
    chart.timeScale().fitContent();
    const observer = new ResizeObserver(() => {
      chart.resize(el.clientWidth, 260);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data]);

  return <div ref={ref} className="w-full" />;
}
