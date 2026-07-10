import { useState, useEffect } from 'react';
import { heroImages } from '@/data/products';
import { StoreStatus } from './StoreStatus';

export const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-72 overflow-hidden sm:h-80">
      {/* Background images with crossfade */}
      {heroImages.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image}
            alt="Esfiha artesanal"
            loading={index === 0 ? 'eager' : 'lazy'}
            {...({ fetchpriority: index === 0 ? 'high' : 'auto' } as any)}
            decoding="async"
            className="h-full w-full object-cover blur-sm scale-110"
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <img
          src="/images/logo.jpg"
          alt="UP Esfihas"
          className="h-24 w-24 rounded-full border-4 border-primary object-cover shadow-2xl sm:h-32 sm:w-32"
        />
        <h1 className="mt-4 text-center text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
          UP Esfihas Artesanais
        </h1>
        <p className="mt-1 text-center text-white/90 drop-shadow-md italic">
          A experiência da esfiha perfeita, sem sair de casa.
        </p>
        <div className="mt-4">
          <StoreStatus />
        </div>
      </div>
    </section>
  );
};
