import { categories, categoryImages } from '@/data/products';

interface CategoryBarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryBar = ({ selectedCategory, onSelectCategory }: CategoryBarProps) => {
  const allCategories = [...categories, 'Todas'];

  return (
    <div className="sticky top-16 z-40 border-b bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-center text-xl font-bold text-foreground">Menu</h2>
        <div className="flex justify-center gap-3 overflow-x-auto pb-2 sm:gap-4">
          {allCategories.map((category) => {
            const isSelected = category === 'Todas' 
              ? selectedCategory === null 
              : selectedCategory === category;
            
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category === 'Todas' ? null : category)}
                className={`flex flex-col items-center gap-2 rounded-xl p-2 transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                    : 'bg-card hover:bg-muted'
                }`}
              >
                <div className="h-16 w-16 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                  <img
                    src={categoryImages[category]}
                    alt={category}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xs font-medium sm:text-sm">{category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
