import { HiChevronLeft, HiChevronRight, HiTrendingUp } from 'react-icons/hi';
import { useRef } from 'react';
import { AssetTrendingCard } from './AssetTrendingCard';

interface TrendingAsset {
  id: string;
  name: string;
  image: string;
  price: number;
  badge?: string;
  change?: string;
}

interface TrendingCarouselProps {
  assets: TrendingAsset[];
  onAssetClick?: (assetId: string) => void;
  onFavoriteClick?: (assetId: string) => void;
}

export const TrendingCarousel = ({ assets, onAssetClick, onFavoriteClick }: TrendingCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of one card plus gap
      const newScrollPosition = direction === 'left'
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HiTrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">Trending Assets</h2>
              <p className="text-neutral">Most popular assets this week</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="btn btn-circle btn-outline btn-sm"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="btn btn-circle btn-outline btn-sm"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {assets.map((asset, index) => (
              <AssetTrendingCard
                key={asset.id}
                asset={asset}
                rank={index + 1}
                onAssetClick={onAssetClick}
                onFavoriteClick={onFavoriteClick}
              />
            ))}
          </div>

          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-base-100 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-base-100 to-transparent pointer-events-none"></div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-center gap-2 mt-6">
          <button
            onClick={() => scroll('left')}
            className="btn btn-circle btn-outline btn-sm"
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="btn btn-circle btn-outline btn-sm"
          >
            <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};