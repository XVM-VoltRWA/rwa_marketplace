interface AssetCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  minValuation: number;
  image: string;
  trending?: boolean;
  badge?: string;
  onBuyClick?: () => void;
}

export const AssetCard = ({
  name,
  category,
  price,
  minValuation,
  image,
  badge,
  onBuyClick,
}: AssetCardProps) => {
  return (
    <div className="card bg-base-300 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden rounded-xl">
      {/* Image Container */}
      <figure className="relative h-48 overflow-hidden bg-black">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        {/* Badge */}
        {badge && (
          <div className="absolute top-3 right-3">
            <span className={`badge ${
              badge === 'Trending' ? 'bg-success/90 text-white' :
              badge === 'Hot' ? 'bg-error text-error-content' :
              badge === 'New' ? 'bg-success text-success-content' :
              badge === 'Gold' || badge === 'Inflation Hedge' ? 'bg-warning/80 text-black' :
              badge === 'Nike' ? 'bg-black/80 text-white' :
              'bg-secondary text-secondary-content'
            } backdrop-blur-sm border-0 font-medium px-3 py-1`}>
              {badge}
            </span>
          </div>
        )}
      </figure>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-base-content line-clamp-2">
          {name}
        </h3>

        {/* Price Section - Horizontal Layout */}
        <div className="space-y-3">
          {/* Price */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-base-content/60">Price</p>
            <p className="text-lg font-bold text-base-content">
              {price.toLocaleString()} XRP
            </p>
          </div>
        </div>

        {/* Action Button with Gradient */}
        <button
          onClick={onBuyClick}
          className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #3788F3 0%, #29abe2 100%)',
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};