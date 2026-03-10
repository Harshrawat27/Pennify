import type { FeatherIcon } from '@/lib/models/types';

export interface DefaultCategory {
  name: string;
  icon: FeatherIcon;
  color: string;
  parentCategory: string;
}

export const PARENT_CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': '#F97316',
  Transport: '#3B82F6',
  Shopping: '#8B5CF6',
  'Bills & Utilities': '#CA8A04',
  'Health & Wellness': '#16A34A',
  Entertainment: '#DB2777',
  'Personal Care': '#E11D48',
  Education: '#4F46E5',
  Travel: '#0D9488',
  Other: '#6B7280',
};

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  // Food & Drink
  {
    name: 'Groceries',
    icon: 'shopping-cart',
    color: '#F97316',
    parentCategory: 'Food & Drink',
  },
  {
    name: 'Restaurants',
    icon: 'coffee',
    color: '#F97316',
    parentCategory: 'Food & Drink',
  },
  {
    name: 'Coffee & Cafes',
    icon: 'coffee',
    color: '#F97316',
    parentCategory: 'Food & Drink',
  },
  {
    name: 'Takeaway & Delivery',
    icon: 'truck',
    color: '#F97316',
    parentCategory: 'Food & Drink',
  },
  {
    name: 'Alcohol & Bars',
    icon: 'droplet',
    color: '#F97316',
    parentCategory: 'Food & Drink',
  },

  // Transport
  { name: 'Fuel', icon: 'zap', color: '#3B82F6', parentCategory: 'Transport' },
  {
    name: 'Public Transport',
    icon: 'navigation',
    color: '#3B82F6',
    parentCategory: 'Transport',
  },
  {
    name: 'Taxi & Ride Share',
    icon: 'map-pin',
    color: '#3B82F6',
    parentCategory: 'Transport',
  },
  {
    name: 'Parking',
    icon: 'map',
    color: '#3B82F6',
    parentCategory: 'Transport',
  },
  {
    name: 'Car Maintenance',
    icon: 'tool',
    color: '#3B82F6',
    parentCategory: 'Transport',
  },

  // Shopping
  {
    name: 'Clothing & Fashion',
    icon: 'tag',
    color: '#8B5CF6',
    parentCategory: 'Shopping',
  },
  {
    name: 'Electronics',
    icon: 'monitor',
    color: '#8B5CF6',
    parentCategory: 'Shopping',
  },
  {
    name: 'Home & Furniture',
    icon: 'layers',
    color: '#8B5CF6',
    parentCategory: 'Shopping',
  },
  {
    name: 'Books & Stationery',
    icon: 'book',
    color: '#8B5CF6',
    parentCategory: 'Shopping',
  },
  {
    name: 'Gifts & Donations',
    icon: 'gift',
    color: '#8B5CF6',
    parentCategory: 'Shopping',
  },

  // Bills & Utilities
  {
    name: 'Rent & Mortgage',
    icon: 'home',
    color: '#CA8A04',
    parentCategory: 'Bills & Utilities',
  },
  {
    name: 'Electricity & Gas',
    icon: 'zap',
    color: '#CA8A04',
    parentCategory: 'Bills & Utilities',
  },
  {
    name: 'Internet & Phone',
    icon: 'wifi',
    color: '#CA8A04',
    parentCategory: 'Bills & Utilities',
  },
  {
    name: 'Water',
    icon: 'droplet',
    color: '#CA8A04',
    parentCategory: 'Bills & Utilities',
  },
  {
    name: 'Insurance',
    icon: 'shield',
    color: '#CA8A04',
    parentCategory: 'Bills & Utilities',
  },

  // Health & Wellness
  {
    name: 'Gym & Fitness',
    icon: 'activity',
    color: '#16A34A',
    parentCategory: 'Health & Wellness',
  },
  {
    name: 'Doctor & Medical',
    icon: 'heart',
    color: '#16A34A',
    parentCategory: 'Health & Wellness',
  },
  {
    name: 'Pharmacy',
    icon: 'plus-circle',
    color: '#16A34A',
    parentCategory: 'Health & Wellness',
  },
  {
    name: 'Mental Health',
    icon: 'sun',
    color: '#16A34A',
    parentCategory: 'Health & Wellness',
  },

  // Entertainment
  {
    name: 'Movies & Cinema',
    icon: 'film',
    color: '#DB2777',
    parentCategory: 'Entertainment',
  },
  {
    name: 'Streaming Services',
    icon: 'play-circle',
    color: '#DB2777',
    parentCategory: 'Entertainment',
  },
  {
    name: 'Games & Apps',
    icon: 'grid',
    color: '#DB2777',
    parentCategory: 'Entertainment',
  },
  {
    name: 'Hobbies & Sports',
    icon: 'compass',
    color: '#DB2777',
    parentCategory: 'Entertainment',
  },

  // Personal Care
  {
    name: 'Haircut & Salon',
    icon: 'scissors',
    color: '#E11D48',
    parentCategory: 'Personal Care',
  },
  {
    name: 'Skincare & Beauty',
    icon: 'star',
    color: '#E11D48',
    parentCategory: 'Personal Care',
  },
  {
    name: 'Spa & Wellness',
    icon: 'feather',
    color: '#E11D48',
    parentCategory: 'Personal Care',
  },

  // Education
  {
    name: 'Courses & Training',
    icon: 'book-open',
    color: '#4F46E5',
    parentCategory: 'Education',
  },
  {
    name: 'Tuition & School',
    icon: 'award',
    color: '#4F46E5',
    parentCategory: 'Education',
  },
  {
    name: 'Kids & Childcare',
    icon: 'users',
    color: '#4F46E5',
    parentCategory: 'Education',
  },
  {
    name: 'Productivity Tools',
    icon: 'cpu',
    color: '#4F46E5',
    parentCategory: 'Education',
  },

  // Travel
  { name: 'Flights', icon: 'send', color: '#0D9488', parentCategory: 'Travel' },
  {
    name: 'Hotels & Stays',
    icon: 'map',
    color: '#0D9488',
    parentCategory: 'Travel',
  },
  {
    name: 'Activities & Tours',
    icon: 'camera',
    color: '#0D9488',
    parentCategory: 'Travel',
  },
  {
    name: 'Travel Essentials',
    icon: 'briefcase',
    color: '#0D9488',
    parentCategory: 'Travel',
  },

  // Other
  { name: 'Pets', icon: 'smile', color: '#6B7280', parentCategory: 'Other' },
  {
    name: 'Miscellaneous',
    icon: 'more-horizontal',
    color: '#6B7280',
    parentCategory: 'Other',
  },
];

export const PARENT_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Health & Wellness',
  'Entertainment',
  'Personal Care',
  'Education',
  'Travel',
  'Other',
] as const;
