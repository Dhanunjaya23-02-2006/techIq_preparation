import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const COLORS = ['#FF9933', '#138808', '#000080', '#6366f1', '#ec4899', '#f59e0b'];

export default function PerformanceCharts({ data }) {
  if (!data || (!data.recent_attempts?.length && !data.subject_stats?.length)) {
    return null;
  }

  // Format trend data
  const trendData = (data.recent_attempts || []).map((attempt, index) => ({
    name: `Test ${index + 1}`,
    score: attempt.score,
  }));

  // Format subject data
  const subjectData = (data.subject_stats || []).map(stat => ({
    name: stat.subject || 'General',
    accuracy: Math.round((stat.correct / stat.total) * 100) || 0
  }));

  const pieData = [
    { name: 'Correct', value: data.total_correct },
    { name: 'Wrong', value: data.total_wrong },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '32px' }}>
      {/* Score Trend */}
      <div className="glass-card" style={{ padding: '24px', minWidth: 0, minHeight: 300 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>📈 Score Progression</h3>
        <div style={{ width: '100%', height: 250, minHeight: 250, position: 'relative', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ background: '#121212', border: '1px solid var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: '#FF9933' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#FF9933" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#FF9933' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Accuracy */}
      <div className="glass-card" style={{ padding: '24px', minWidth: 0, minHeight: 300 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>📊 Subject-wise Accuracy (%)</h3>
        <div style={{ width: '100%', height: 250, minHeight: 250, position: 'relative', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={subjectData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ background: '#121212', border: '1px solid var(--border)', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

  );
}
