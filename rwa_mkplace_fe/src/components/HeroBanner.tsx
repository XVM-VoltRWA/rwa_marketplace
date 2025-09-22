import { HiArrowRight, HiSparkles } from "react-icons/hi";

interface HeroBannerProps {
  featuredAsset: {
    id: string;
    name: string;
    image: string;
    price: number;
    badge?: string;
  };
  onExploreClick?: () => void;
  onAssetClick?: (assetId: string) => void;
}

export const HeroBanner = ({ featuredAsset, onExploreClick, onAssetClick }: HeroBannerProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-base-200 to-base-300 rounded-2xl mx-4 mb-8">
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <HiSparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Featured Asset</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-base-content leading-tight">
              Discover Premium
              <span className="text-primary block">RWA Assets</span>
            </h1>

            <p className="text-lg text-neutral leading-relaxed">
              Invest in real-world assets backed by blockchain technology. Discover luxury goods,
              and collectibles tokenized for secure ownership.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onExploreClick} className="btn btn-primary btn-lg rounded-xl group">
                Explore Marketplace
                <HiArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="btn btn-outline btn-lg rounded-xl">Learn More</button>
            </div>

            {/* Pre-Launch Info */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-base-content">Coming Soon</div>
                <div className="text-sm text-neutral">Platform Launch</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">3000+</div>
                <div className="text-sm text-neutral">Email Signups</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content">Q1 2026</div>
                <div className="text-sm text-neutral">Expected Launch</div>
              </div>
            </div>
          </div>

          {/* Right Content - Featured Asset */}
          <div className="relative">
            <div
              className="card bg-base-100/50 backdrop-blur-sm shadow-2xl border border-base-200/50 overflow-hidden rounded-xl group cursor-pointer hover:shadow-3xl transition-all duration-300"
              onClick={() => onAssetClick?.(featuredAsset.id)}
            >
              {/* Featured Badge */}
              <div className="absolute top-6 left-6 z-10">
                <div className="badge bg-primary/90 text-white font-bold px-4 py-3 text-sm">
                  ⭐ Featured
                </div>
              </div>

              {/* Image */}
              <figure className="relative h-80 overflow-hidden bg-black">
                <img
                  src={featuredAsset.image}
                  alt={featuredAsset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {featuredAsset.badge && (
                  <div className="absolute top-6 right-6">
                    <span className="badge bg-success/90 text-white font-medium px-3 py-2">
                      {featuredAsset.badge}
                    </span>
                  </div>
                )}
              </figure>

              {/* Card Body */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-base-content mb-4 line-clamp-2">
                  {featuredAsset.name}
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-neutral mb-1">Starting Price</p>
                    <p className="text-3xl font-bold text-primary">
                      {featuredAsset.price.toLocaleString()} XRP
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral mb-1">24h Change</p>
                    <p className="text-lg font-semibold text-success">+2.5%</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="btn btn-primary flex-1 btn-lg rounded-xl">View Details</button>
                  <button className="btn btn-outline btn-lg rounded-xl px-6">♡</button>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
