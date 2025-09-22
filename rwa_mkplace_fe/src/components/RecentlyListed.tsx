import { HiClock, HiArrowRight } from 'react-icons/hi';

interface RecentAsset {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  listedDate: string;
}

interface RecentlyListedProps {
  assets: RecentAsset[];
  onAssetClick?: (assetId: string) => void;
  onViewAllClick?: () => void;
}

export const RecentlyListed = ({ assets, onAssetClick, onViewAllClick }: RecentlyListedProps) => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <HiClock className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">Recently Listed</h2>
              <p className="text-neutral">Fresh assets added to the marketplace</p>
            </div>
          </div>

          <button
            onClick={onViewAllClick}
            className="hidden md:flex items-center gap-2 btn btn-outline btn-sm"
          >
            View All
            <HiArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.slice(0, 6).map((asset) => (
            <div
              key={asset.id}
              onClick={() => onAssetClick?.(asset.id)}
              className="group cursor-pointer"
            >
              <div className="card bg-base-300 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden rounded-xl">
                {/* New Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="badge bg-secondary/90 text-white font-bold px-3 py-2">
                    NEW
                  </div>
                </div>

                {/* Image */}
                <figure className="relative h-48 overflow-hidden bg-black">
                  <img
                    src={asset.image}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </figure>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-base-content line-clamp-2 flex-1">
                      {asset.name}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="badge badge-outline text-xs">
                      {asset.category}
                    </span>
                    <span className="text-xs text-neutral">
                      Listed {asset.listedDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-neutral">Price</p>
                      <p className="text-xl font-bold text-base-content">
                        {asset.price.toLocaleString()} XRP
                      </p>
                    </div>

                    <button className="btn btn-primary btn-sm rounded-lg">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="flex md:hidden justify-center mt-8">
          <button
            onClick={onViewAllClick}
            className="btn btn-outline gap-2"
          >
            View All Recent Assets
            <HiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};