export type DesignStatus = 'Draft' | 'Under Review' | 'Accepted' | 'Rejected';
export type SampleVerdict = 'Pending' | 'Approved' | 'Rejected';
export type ReadinessStatus = 'Pending' | 'On Progress' | 'Ready' | 'Launched';

export interface DesignVersion {
  id: string;
  version: string;
  status: DesignStatus;
  imageUrl: string;
  date: string;
  notes?: string;
}

export interface Metric {
  id: string;
  name: string;
  unit: string;
  higherIsBetter: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  metrics: Record<string, number>;
}

export interface Sample {
  id: string;
  batchId: string;
  date: string;
  verdict: SampleVerdict;
  metrics: Record<string, number>;
  pmComments?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  status: ReadinessStatus;
  designs: DesignVersion[];
  samples: Sample[];
  metricDefinitions: Metric[];
  competitors: Competitor[];
}
