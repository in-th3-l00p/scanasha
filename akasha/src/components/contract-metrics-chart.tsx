import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography } from '@/components/ui/typography';

export interface ContractMetrics {
  autonomy: number;
  exitwindow: number;
  chain: number;
  upgradeability: number;
}

interface ContractMetricsChartProps {
  metrics: ContractMetrics;
}

// Function to determine color based on value
const getColorForValue = (value: number): string => {
  if (value >= 0.8) return '#4ade80'; // green
  if (value >= 0.5) return '#facc15'; // yellow
  return '#f87171'; // red
};

export const ContractMetricsChart: React.FC<ContractMetricsChartProps> = ({ metrics }) => {
  // Transform metrics object into array format for recharts
  const data = Object.entries(metrics).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
    value,
    fullMark: 1.0,
  }));

  return (
    <div className="flex flex-col items-center mb-8">
      <Typography variant="h5" className="mb-4">Contract Security Metrics</Typography>
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${(value * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorForValue(entry.value)} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#4ade80' }}></div>
          <span>Good (80-100%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#facc15' }}></div>
          <span>Medium (50-79%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#f87171' }}></div>
          <span>Poor (0-49%)</span>
        </div>
      </div>
    </div>
  );
}; 