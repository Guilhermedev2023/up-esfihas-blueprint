import { categories, categoryImages } from '@/data/products';

interface CategoryBarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryBar = ({ selectedCategory, onSelectCategory }: CategoryBarProps) => {
  const allCategories = [...categories, 'Todas'];

  return (
    <div className="sticky top-14 z-40 bg-card border-b border-border">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          {allCategories.map((category) => {
            const isSelected = category === 'Todas' 
              ? selectedCategory === null 
              : selectedCategory === category;
            
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category === 'Todas' ? null : category)}
                className={`flex flex-col items-center gap-1 min-w-[80px] sm:min-w-[100px] rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <img 
                  src={categoryImages[category]} 
                  alt={category}
                  className="h-10 w-10 rounded-full object-cover border-2 border-white/20"
                />
                <span className="text-center leading-tight whitespace-normal">
                  {category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
