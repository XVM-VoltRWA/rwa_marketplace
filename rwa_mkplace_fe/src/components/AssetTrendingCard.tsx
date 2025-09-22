interface AssetTrendingCardProps {
  asset: {
    id: string;
    name: string;
    image: string;
    price: number;
    badge?: string;
    change?: string;
  };
  rank?: number;
  onAssetClick?: (assetId: string) => void;
  onFavoriteClick?: (assetId: string) => void;
}

export const AssetTrendingCard = ({ asset, rank, onAssetClick, onFavoriteClick }: AssetTrendingCardProps) => {
  return (
    <div
      key={asset.id}
      onClick={() => onAssetClick?.(asset.id)}
      className="flex-none w-80 cursor-pointer group"
    >
      <div className="card bg-base-300 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden rounded-xl">
        {/* Rank Badge */}
        {rank && (
          <div className="absolute top-4 left-4 z-10">
            <div className="badge bg-primary/90 text-white font-bold px-3 py-2">
              #{rank}
            </div>
          </div>
        )}

        {/* Image */}
        <figure className="relative h-48 overflow-hidden bg-black">
          <img
            src={asset.image}
            alt={asset.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />

          {/* Status Badge */}
          {asset.badge && (
            <div className="absolute top-4 right-4">
              <span className="badge bg-success/90 text-white font-medium px-3 py-1">
                {asset.badge}
              </span>
            </div>
          )}
        </figure>

        {/* Card Body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-base-content mb-3 line-clamp-2">
            {asset.name}
          </h3>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral">Current Price</p>
              <p className="text-xl font-bold text-base-content">
                {asset.price.toLocaleString()} XRP
              </p>
            </div>

            {asset.change && (
              <div className="text-right">
                <p className="text-sm text-neutral">24h Change</p>
                <p className={`text-sm font-semibold ${
                  asset.change.startsWith('+') ? 'text-success' : 'text-error'
                }`}>
                  {asset.change}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary btn-sm flex-1 rounded-lg">
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteClick?.(asset.id);
              }}
              className="btn btn-outline btn-sm rounded-lg px-3"
            >
              ♡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};