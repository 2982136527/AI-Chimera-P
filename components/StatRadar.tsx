import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CreatureStats } from '../types';

interface StatRadarProps {
  stats: CreatureStats;
}

const StatRadar: React.FC<StatRadarProps> = ({ stats }) => {
  const data = [
    { subject: '生命', fullSubject: '生命 VIT', A: stats.vitality, fullMark: 150 },
    { subject: '力量', fullSubject: '力量 STR', A: stats.power, fullMark: 150 },
    { subject: '护甲', fullSubject: '护甲 DEF', A: stats.armor, fullMark: 150 },
    { subject: '敏捷', fullSubject: '敏捷 AGI', A: stats.agility, fullMark: 150 },
    { subject: '意志', fullSubject: '意志 RES', A: stats.spirit, fullMark: 150 },
    { subject: '灵能', fullSubject: '灵能 MAG', A: stats.magic, fullMark: 150 },
  ];

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="50%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="fullSubject" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
            tickSize={12}
          />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="能力"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={2}
            fill="#6366f1"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatRadar;