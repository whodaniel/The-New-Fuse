import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
// Import WorkspaceData type
interface WorkspaceData {
  id: string;
  name: string;
  // Add other properties as needed
}

interface ChartableProps {
  workspace: WorkspaceData | null;
  props: {
    content: string;
    uuid?: string;
  };
}

interface ChartData {
  type: "line" | "bar" | "pie";
  data: any[];
  config: {
    xKey?: string;
    yKey?: string;
    dataKey?: string;
    nameKey?: string;
    valueKey?: string;
    colors?: string[];
  };
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
];

export default function Chartable({ workspace, props }: ChartableProps): JSX.Element | null {
  const [error, setError] = useState<string | null>(null);

  try {
    const chartData: ChartData = JSON.parse(props.content);
    const { type, data, config } = chartData;

    if (!data || data.length === 0) {
      return null;
    }

    const renderChart = () => {
      switch (type) {
        case "line":
          return (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={config.yKey}
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          );
        case "bar":
          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={config.dataKey} fill="#8884d8" />
            </BarChart>
          );
        case "pie":
          return (
            <PieChart>
              <Pie
                data={data}
                dataKey={config.valueKey}
                nameKey={config.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          );
        default:
          return null;
      }
    };

    return (
      <div className="flex justify-center items-end w-full">
        <div className="py-2 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    setError(e instanceof Error ? e.message : "Failed to parse chart data");
    return null;
  }
}