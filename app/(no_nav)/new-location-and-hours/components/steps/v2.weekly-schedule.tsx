import React, { useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Hours } from "@/types";

interface WeeklyScheduleChartProps {
  hours?: Hours;
  handleDayClick?: (day: string) => void;
  showSubTitle?: boolean;
  bgColor?: string;
  fontColors?: string;
  barColor?: string;
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  title?: string;
  editHours?: boolean;
}

const WeeklyScheduleChart = ({
  hours,
  title = "Weekly Schedule",
  handleDayClick,
  showSubTitle = false,
  bgColor = "#fff",
  fontColors = "#000",
  barColor = "#fff",
  viewBoxHeight = 450,
  viewBoxWidth = 700,
  editHours = true,
}: WeeklyScheduleChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Transform hours data for Recharts
  const data = weekDays.map((day) => {
    const dayIndex = weekDays.indexOf(day);
    // Filter slots for this day
    const daySlots =
      hours?.pickup.filter((p) => {
        const date = new Date(p.date);
        return date.getDay() === dayIndex;
      }) || [];

    // Extract time slots
    const timeSlots = daySlots.flatMap((slot) =>
      (slot.timeSlots || []).map((timeSlot) => ({
        start: timeSlot.open / 60,
        end: timeSlot.close / 60,
        height: (timeSlot.close - timeSlot.open) / 60,
      }))
    );

    return {
      day: day.slice(0, 3),
      fullDay: day,
      slots: timeSlots,
      // Create a fake datum to ensure the day is always shown
      placeholder: 0.0001,
    };
  });

  const formatHour = (hour: number) => {
    if (hour === 0 || hour === 24) return "12 AM";
    if (hour === 12) return "Noon";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const handleBarClick = (day: string) => {
    if (handleDayClick && editHours) {
      handleDayClick(day);
    }
  };

  // Custom bar component with rounded corners
  const RoundedBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const radius = 6;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={radius}
          ry={radius}
          filter="url(#dropShadow)"
        />
        {editHours && (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="transparent"
            rx={radius}
            ry={radius}
            className="hover:fill-black hover:opacity-50"
            style={{ cursor: "pointer" }}
          />
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center"
      style={{
        minHeight: "450px",
        backgroundColor: bgColor,
        borderRadius: "15px",
      }}
    >
      <svg width="0" height="0">
        <defs>
          <filter id="dropShadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="30%" stopColor="#f4f4f5" />
            <stop offset="49%" stopColor="#d9b759" />
            <stop offset="51%" stopColor="#d9b759" />
            <stop offset="80%" stopColor="#f4f4f5" />
          </linearGradient>
        </defs>
      </svg>

      <h2
        style={{
          fontSize: Math.min(viewBoxWidth, viewBoxHeight) * 0.025 * 1.4,
          color: fontColors,
        }}
        className="text-center font-medium"
      >
        {title}
      </h2>

      {showSubTitle && (
        <p
          style={{
            fontSize: Math.min(viewBoxWidth, viewBoxHeight) * 0.025 * 0.8,
            color: "gray",
          }}
          className="text-center"
        >
          Click on Day of the Week to Modify
        </p>
      )}

      <div
        style={{
          width: "100%",
          height: "calc(100% - 60px)",
          background: "url(#bgGradient)",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            barGap={0}
            barCategoryGap="15%"
          >
            <XAxis
              type="number"
              domain={[0, 24]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              tickFormatter={formatHour}
              stroke={fontColors}
              fontSize={Math.min(viewBoxWidth, viewBoxHeight) * 0.025 * 0.7}
            />
            <YAxis
              dataKey="day"
              type="category"
              stroke={fontColors}
              fontSize={Math.min(viewBoxWidth, viewBoxHeight) * 0.025 * 0.75}
              tickLine={false}
              axisLine={false}
              onClick={(value) => {
                const day = data.find((d) => d.day === value)?.fullDay;
                if (day) handleBarClick(day);
              }}
              style={{ cursor: "pointer", textDecoration: "underline" }}
            />
            <Tooltip
              formatter={(value, name, props) => {
                // Type-safe check for dataKey
                const dataKeyStr = props.dataKey;
                if (!dataKeyStr || typeof dataKeyStr !== "string") {
                  return ["", ""];
                }

                // Parse the slot index from the dataKey
                const match = dataKeyStr.match(/slots\[(\d+)\].height/);
                if (!match || !match[1]) {
                  return ["", ""];
                }

                const slotIndex = parseInt(match[1], 10);
                const slot = props.payload.slots?.[slotIndex];

                if (slot) {
                  return [
                    `${formatHour(slot.start)} - ${formatHour(slot.end)}`,
                    "Hours",
                  ];
                }
                return ["", ""];
              }}
              contentStyle={{
                backgroundColor: bgColor,
                border: `1px solid ${fontColors}`,
              }}
              labelStyle={{ color: fontColors }}
            />
            {/* Always render the placeholder to ensure days without slots are shown */}
            <Bar dataKey="placeholder" fill="transparent" barSize={1} />

            {/* Dynamically create bars for each time slot */}
            {data[0]?.slots &&
              data.flatMap((dayData, dayIndex) =>
                dayData.slots.map((_, slotIndex) => (
                  <Bar
                    key={`${dayIndex}-${slotIndex}`}
                    dataKey={`slots[${slotIndex}].height`}
                    fill={barColor}
                    onClick={() => handleBarClick(dayData.fullDay)}
                    style={{ cursor: editHours ? "pointer" : "default" }}
                    shape={<RoundedBar />}
                    stackId="stack"
                  />
                ))
              )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyScheduleChart;
