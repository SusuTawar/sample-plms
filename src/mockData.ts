import { Product } from './types';

export const initialProduct: Product = {
  id: 'SKU-AGP-2024',
  name: 'AeroGlide Pro Running Shoe',
  category: 'Footwear',
  status: 'On Progress',
  metricDefinitions: [
    { id: 'weight', name: 'Weight', unit: 'g', higherIsBetter: false },
    { id: 'durability', name: 'Durability', unit: 'cycles', higherIsBetter: true },
    { id: 'breathability', name: 'Breathability', unit: '/10', higherIsBetter: true },
    { id: 'cushioning', name: 'Energy Return', unit: '%', higherIsBetter: true },
  ],
  competitors: [
    {
      id: 'c-1',
      name: 'Nike Pegasus 40',
      metrics: { weight: 260, durability: 12000, breathability: 8.0, cushioning: 60 }
    },
    {
      id: 'c-2',
      name: 'Adidas Ultraboost',
      metrics: { weight: 290, durability: 14000, breathability: 8.5, cushioning: 68 }
    },
    {
      id: 'c-3',
      name: 'Under Armour Flow',
      metrics: { weight: 240, durability: 10000, breathability: 9.0, cushioning: 55 }
    },
    {
      id: 'c-4',
      name: 'Brooks Ghost 15',
      metrics: { weight: 280, durability: 16000, breathability: 7.5, cushioning: 62 }
    }
  ],
  designs: [
    {
      id: 'd-3',
      version: 'v1.2',
      status: 'Under Review',
      imageUrl: 'https://picsum.photos/seed/shoe3/800/600',
      date: '2023-11-01',
      notes: 'Final tweaks to the heel counter and logo contrast.'
    },
    {
      id: 'd-2',
      version: 'v1.1',
      status: 'Rejected',
      imageUrl: 'https://picsum.photos/seed/shoe2/800/600',
      date: '2023-10-25',
      notes: 'Updated logo placement. Rejected due to incorrect color pantone.'
    },
    {
      id: 'd-1',
      version: 'v1.0',
      status: 'Rejected',
      imageUrl: 'https://picsum.photos/seed/shoe1/800/600',
      date: '2023-10-10',
      notes: 'Initial draft. Mesh too dense.'
    }
  ],
  samples: [
    {
      id: 's-3',
      batchId: 'Batch #1003',
      date: '2023-11-02',
      verdict: 'Pending',
      metrics: { weight: 250, durability: 14000, breathability: 8.2, cushioning: 62 }
    },
    {
      id: 's-2',
      batchId: 'Batch #1002',
      date: '2023-10-26',
      verdict: 'Approved',
      metrics: { weight: 245, durability: 16000, breathability: 8.5, cushioning: 65 }
    },
    {
      id: 's-1',
      batchId: 'Batch #1001',
      date: '2023-10-15',
      verdict: 'Rejected',
      pmComments: 'Weight is too high compared to benchmark. Unacceptable for a "Pro" model.',
      metrics: { weight: 280, durability: 15000, breathability: 7.5, cushioning: 58 }
    }
  ]
};
