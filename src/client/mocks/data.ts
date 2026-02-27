/**
 * Mock data for local development
 * Used when MOCK_MODE environment variable is set to true
 */

import type { Fragrance } from '../api/fragrances';

export const mockFragrances: Fragrance[] = [
  {
    id: '1',
    name: 'Lavender Dreams',
    description: 'Calming lavender with hints of vanilla',
    category: 'Floral',
    image_url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=200',
    recipe: '60% Lavender, 30% Vanilla, 10% White Musk',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Ocean Breeze',
    description: 'Fresh and clean ocean scent',
    category: 'Fresh',
    image_url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=200',
    recipe: '50% Sea Salt, 30% Driftwood, 20% Citrus',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Warm Cinnamon',
    description: 'Spicy and comforting cinnamon',
    category: 'Spice',
    image_url: 'https://images.unsplash.com/photo-1599152595431-39265d71f7f5?w=200',
    recipe: '70% Cinnamon, 20% Clove, 10% Orange Peel',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Vanilla Bean',
    description: 'Rich and creamy vanilla',
    category: 'Sweet',
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784538?w=200',
    recipe: '80% Vanilla Bean, 15% Caramel, 5% Sandalwood',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Pine Forest',
    description: 'Crisp pine needles and fresh air',
    category: 'Woodsy',
    image_url: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=200',
    recipe: '60% Pine, 25% Cedar, 15% Eucalyptus',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Rose Garden',
    description: 'Classic rose with a modern twist',
    category: 'Floral',
    image_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=200',
    recipe: '65% Rose, 25% Jasmine, 10% Amber',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockBoardId = 12345;
export const mockSessionToken = 'mock-session-token-for-local-dev';
