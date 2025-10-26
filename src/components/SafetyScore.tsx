import { Shield, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SafetyScoreProps {
  score: number;
  className?: string;
}

export const SafetyScore = ({ score, className = '' }: SafetyScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Very Safe';
    if (score >= 3) return 'Safe';
    if (score >= 2) return 'Moderate';
    return 'Needs Attention';
  };

  return (
    <Badge variant="outline" className={`${getScoreColor(score)} ${className}`}>
      <Shield className="h-3 w-3 mr-1" />
      Safety: {getScoreLabel(score)}
      <div className="flex ml-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < score ? 'fill-current' : 'opacity-30'}`}
          />
        ))}
      </div>
    </Badge>
  );
};