interface CategoryBannerProps {
  title: string;
}

export const CategoryBanner = ({ title }: CategoryBannerProps) => {
  return (
    <div className="mb-4 mt-2 rounded-xl bg-gradient-to-r from-primary/90 to-secondary/80 px-4 py-3 shadow-sm">
      <h2 className="text-lg font-bold text-white sm:text-xl">
        {title}
      </h2>
    </div>
  );
};