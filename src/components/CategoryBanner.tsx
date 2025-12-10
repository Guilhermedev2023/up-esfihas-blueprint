interface CategoryBannerProps {
  title: string;
  image?: string;
}

export const CategoryBanner = ({ title, image }: CategoryBannerProps) => {
  return (
    <div 
      className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 to-secondary/90"
      style={{
        backgroundImage: image ? `linear-gradient(to right, rgba(139, 44, 30, 0.85), rgba(198, 90, 52, 0.85)), url(${image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="px-4 py-3">
        <h2 className="text-lg font-bold text-primary-foreground">{title}</h2>
      </div>
    </div>
  );
};
