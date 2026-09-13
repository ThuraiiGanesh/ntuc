export interface SampleDish {
  id: string;
  name: string;
  name_local: string;
  category: string;
  image_url: string;
  badge: string;
}

export const SAMPLE_HAWKER_DISHES: SampleDish[] = [
  {
    id: 'chicken-rice-steamed',
    name: 'Steamed Chicken Rice',
    name_local: '白鸡饭 (Bai Ji Fan)',
    category: 'Chinese',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
    badge: 'National Icon'
  },
  {
    id: 'char-kway-teow',
    name: 'Char Kway Teow',
    name_local: '炒粿条',
    category: 'Chinese',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
    badge: 'Smoky Wok Hei'
  },
  {
    id: 'laksa-singapore',
    name: 'Katong Laksa',
    name_local: '加东叻沙',
    category: 'Peranakan',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    badge: 'Rich Coconut Curry'
  },
  {
    id: 'nasi-lemak-set',
    name: 'Nasi Lemak Set',
    name_local: 'Ayam Goreng',
    category: 'Malay',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&q=80',
    badge: 'Crispy Wings & Sambal'
  },
  {
    id: 'roti-prata-plain-2pcs',
    name: 'Roti Prata (2 pcs)',
    name_local: 'Kosong with Curry',
    category: 'Indian',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
    badge: 'Golden Crispy Flatbread'
  },
  {
    id: 'ban-mian-soup',
    name: 'Ban Mian Soup',
    name_local: '板面 (汤)',
    category: 'Chinese',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    badge: 'Healthy Hand-pulled'
  },
  {
    id: 'popiah-fresh',
    name: 'Fresh Popiah (2 rolls)',
    name_local: '薄饼',
    category: 'Chinese',
    image_url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&q=80',
    badge: 'Low Calorie Champion'
  },
  {
    id: 'kaya-toast-set',
    name: 'Kaya Butter Toast Set',
    name_local: '半生熟蛋套餐',
    category: 'Breakfast',
    image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
    badge: 'Kopitiam Classic'
  }
];
