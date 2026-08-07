import { CategoryPack } from '../types';
import { Language } from './translations';

export const DEFAULT_CATEGORIES_AR: CategoryPack[] = [
  {
    id: 'food',
    name: 'أكلات ومشروبات 🍔',
    icon: 'Utensils',
    description: 'وجبات شعبية، أطباق عربية ومشروبات مشهورة',
    words: [
      'كبسة', 'شاورما', 'فلافل', 'مطازيز', 'ورق عنب', 
      'بيتزا', 'كنافة', 'جريش', 'حنيني', 'بليلة', 
      'مظبي', 'مندي', 'معصوب', 'فطور مشكل', 'حمص', 
      'منسف', 'كبة', 'باشاميل', 'شاهي كشري', 'قهوة عربية', 
      'عصير رمان', 'لقيمات', 'مقلوبة', 'سمبوسة', 'شربه بالشوفان'
    ]
  },
  {
    id: 'tv_shows',
    name: 'مسلسلات وبرامج 📺',
    icon: 'Tv',
    description: 'مسلسلات خليجية، عربية وعالمية معروفة',
    words: [
      'طاش ما طاش', 'شباب البومب', 'العوف', 'سكة سفر', 'حارة الشيخ', 
      'صراع العروش', 'رشاش', 'لعبة الكريات', 'سوداوية', 'سيلفي', 
      'باب الحارة', 'البرنس', 'تشرنوبل', 'المكتب', 'فريندز', 
      'الهروب الفائق', 'المحقق كونان', 'ون بيس', 'هجوم العمالقة', 'الكبير أوي'
    ]
  },
  {
    id: 'countries',
    name: 'دول وعواصم 🌍',
    icon: 'Globe',
    description: 'دول عربية وعالمية وعواصم مشهورة',
    words: [
      'السعودية', 'مصر', 'اليابان', 'الإمارات', 'الكويت', 
      'المغرب', 'تركيا', 'فرنسا', 'إيطاليا', 'البرازيل', 
      'قطر', 'عُمان', 'ألمانيا', 'إسبانيا', 'الأردن', 
      'الصين', 'كندا', 'الأرجنتين', 'تونس', 'لندن'
    ]
  },
  {
    id: 'sports',
    name: 'أندية ورياضة ⚽',
    icon: 'Trophy',
    description: 'أندية كرة قدم ورياضات مختلفة',
    words: [
      'الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'ريال مدريد', 
      'برشلونة', 'مانشستر سيتي', 'ليفربول', 'باريس سان جيرمان', 'بايرن ميونخ', 
      'كرة السلة', 'كرة الطائرة', 'التنس', 'الفورمولا 1', 'السباحة', 
      'الغولف', 'الجمباز', 'الملاكمة', 'الرماح', 'كرة القدم'
    ]
  },
  {
    id: 'gaming',
    name: 'ألعاب إلكترونية 🎮',
    icon: 'Gamepad2',
    description: 'ألعاب فيديو، بلايستيشن وأونلاين مشهورة',
    words: [
      'ببجي', 'فورتنايت', 'فيفا', 'كراش', 'ماينكرافت', 
      'جتا GTA', 'كول أوف ديوتي', 'بلودبورن', 'زيلدا', 'أوفرواتش', 
      'فالورانت', 'ليج أوف ليجندز', 'أساسنز كريد', 'إيلدن رينج', 'سوبر ماريو', 
      'تيكن', 'رزدنت إيفل', 'روكيت ليج', 'أم Silence', 'أمونج أس'
    ]
  },
  {
    id: 'items',
    name: 'أدوات وأشياء 🏛️',
    icon: 'Package',
    description: 'أدوات منزلية وأغراض يومية',
    words: [
      'شاحن', 'مكنسة', 'طاولة', 'ساعة', 'سيارة', 
      'مكيف', 'طائرة', 'تلفزيون', 'ثلاجة', 'كاميرا', 
      'نظارة', 'مظلة', 'حقيبة', 'سماعات', 'فرشاة أسنان', 
      'ميكروويف', 'مروحة', 'مفتاح', 'حاسوب', 'قلم'
    ]
  },
  {
    id: 'places',
    name: 'أماكن ومعالم 🏝️',
    icon: 'MapPin',
    description: 'أماكن عامة ومرافق يومية',
    words: [
      'المطار', 'المستشفى', 'المدرسة', 'المقهى', 'السينما', 
      'الحديقة', 'السوبرماركت', 'الشاطئ', 'الفندق', 'المخبز', 
      'النادي', 'المتحف', 'المطعم', 'المكتبة', 'المحطة'
    ]
  }
];

export const DEFAULT_CATEGORIES_EN: CategoryPack[] = [
  {
    id: 'food',
    name: 'Food & Drinks 🍔',
    icon: 'Utensils',
    description: 'Popular meals, dishes, and drinks',
    words: [
      'Pizza', 'Burger', 'Shawarma', 'Sushi', 'Tacos', 
      'Pancakes', 'Ice Cream', 'Coffee', 'Donuts', 'Pasta', 
      'Steak', 'French Fries', 'Waffles', 'Falafel', 'Kebab', 
      'Salad', 'Sandwich', 'Hot Dog', 'Cupcake', 'Popcorn'
    ]
  },
  {
    id: 'tv_shows',
    name: 'Movies & TV Shows 📺',
    icon: 'Tv',
    description: 'Popular movies, TV series, and shows',
    words: [
      'Friends', 'Game of Thrones', 'Breaking Bad', 'Stranger Things', 'The Office', 
      'Squid Game', 'Harry Potter', 'Inception', 'Avengers', 'Sherlock', 
      'Spider-Man', 'Batman', 'One Piece', 'Naruto', 'Interstellar', 
      'Titanium', 'House of the Dragon', 'Star Wars', 'The Matrix', 'The Simpsons'
    ]
  },
  {
    id: 'countries',
    name: 'Countries & Cities 🌍',
    icon: 'Globe',
    description: 'Global countries and famous capitals',
    words: [
      'Saudi Arabia', 'USA', 'Japan', 'United Kingdom', 'France', 
      'Italy', 'Brazil', 'Germany', 'Spain', 'Egypt', 
      'Canada', 'China', 'Australia', 'Turkey', 'Morocco', 
      'Dubai', 'London', 'Paris', 'Tokyo', 'Rome'
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Clubs ⚽',
    icon: 'Trophy',
    description: 'Famous sports teams and activities',
    words: [
      'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'PSG', 
      'Bayern Munich', 'Basketball', 'Tennis', 'Formula 1', 'Swimming', 
      'Golf', 'Boxing', 'Football', 'Baseball', 'Volleyball', 
      'Al Hilal', 'Al Nassr', 'Cricket', 'Gymnastics', 'Skiing'
    ]
  },
  {
    id: 'gaming',
    name: 'Video Games 🎮',
    icon: 'Gamepad2',
    description: 'Famous console and online video games',
    words: [
      'Fortnite', 'PUBG', 'Minecraft', 'GTA V', 'Call of Duty', 
      'FIFA', 'Elden Ring', 'Valorant', 'Overwatch', 'Among Us', 
      'Super Mario', 'Zelda', 'Rocket League', 'Resident Evil', 'Tetris', 
      'God of War', 'Roblox', 'League of Legends', 'Cyberpunk', 'Assassin\'s Creed'
    ]
  },
  {
    id: 'items',
    name: 'Everyday Objects 🏛️',
    icon: 'Package',
    description: 'Common household items and tech',
    words: [
      'Phone', 'Car', 'Laptop', 'Watch', 'Television', 
      'Camera', 'Headphones', 'Table', 'Key', 'Microwave', 
      'Chair', 'Bicycle', 'Suitcase', 'Glasses', 'Umbrella', 
      'Air Conditioner', 'Fan', 'Refrigerator', 'Pen', 'Spoon'
    ]
  },
  {
    id: 'places',
    name: 'Places & Landmarks 🏝️',
    icon: 'MapPin',
    description: 'Public locations and city facilities',
    words: [
      'Airport', 'Hospital', 'School', 'Café', 'Cinema', 
      'Park', 'Supermarket', 'Beach', 'Hotel', 'Bakery', 
      'Gym', 'Museum', 'Restaurant', 'Library', 'Train Station'
    ]
  }
];

export const DEFAULT_CATEGORIES = DEFAULT_CATEGORIES_AR;

export function getDefaultCategories(lang: Language = 'ar'): CategoryPack[] {
  return lang === 'en' ? DEFAULT_CATEGORIES_EN : DEFAULT_CATEGORIES_AR;
}
