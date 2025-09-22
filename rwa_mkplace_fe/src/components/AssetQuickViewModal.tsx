import { HiX, HiHeart, HiShare, HiTrendingUp, HiClock, HiShieldCheck } from 'react-icons/hi';

interface AssetQuickViewModalProps {
  asset: {
    id: string;
    name: string;
    image: string;
    price: number;
    minValuation?: number;
    categoryId: string;
    description?: string;
  } | null;
  categoryName?: string;
  isOpen: boolean;
  onClose: () => void;
  onBuyClick: () => void;
}

export const AssetQuickViewModal = ({
  asset,
  categoryName,
  isOpen,
  onClose,
  onBuyClick
}: AssetQuickViewModalProps) => {
  if (!asset || !isOpen) return null;

  const mockStats = {
    expectedReturn: '8-12%',
    minimumInvestment: asset.minValuation || 1000,
    totalInvestors: Math.floor(Math.random() * 500) + 50,
    timeHorizon: '12-24 months',
    riskLevel: 'Medium'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-base-200 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 btn btn-circle btn-sm bg-base-100/80 border-0"
        >
          <HiX className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Image Section */}
          <div className="relative h-64 lg:h-auto">
            <img
              src={asset.image}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="badge bg-primary/90 text-white font-bold px-3 py-2">
                {categoryName || 'Asset'}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 lg:p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-base-content mb-2 line-clamp-2">
                  {asset.name}
                </h2>
                <p className="text-3xl font-bold text-primary">
                  {asset.price.toLocaleString()} XRP
                </p>
              </div>

              <div className="flex gap-2">
                <button className="btn btn-ghost btn-circle btn-sm">
                  <HiHeart className="w-5 h-5" />
                </button>
                <button className="btn btn-ghost btn-circle btn-sm">
                  <HiShare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Asset Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-base-content mb-2">About this Asset</h3>
              <p className="text-neutral text-sm leading-relaxed">
                {asset.description ||
                `This premium ${categoryName?.toLowerCase() || 'asset'} represents a unique investment opportunity in the real-world asset market. Carefully vetted and tokenized for your convenience, this asset offers exposure to tangible value with the benefits of blockchain technology.`}
              </p>
            </div>

            {/* Investment Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-base-300/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiTrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-base-content">Expected Return</span>
                </div>
                <p className="text-lg font-bold text-success">{mockStats.expectedReturn}</p>
              </div>

              <div className="bg-base-300/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiClock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-base-content">Time Horizon</span>
                </div>
                <p className="text-lg font-bold text-base-content">{mockStats.timeHorizon}</p>
              </div>

              <div className="bg-base-300/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-base-content">Min. Investment</span>
                </div>
                <p className="text-lg font-bold text-base-content">
                  {mockStats.minimumInvestment.toLocaleString()} XRP
                </p>
              </div>

              <div className="bg-base-300/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiShieldCheck className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-base-content">Risk Level</span>
                </div>
                <p className="text-lg font-bold text-warning">{mockStats.riskLevel}</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="border-t border-base-300/50 pt-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-neutral">Total Investors:</span>
                <span className="font-semibold text-base-content">{mockStats.totalInvestors}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-neutral">Asset ID:</span>
                <span className="font-mono text-xs text-base-content">#{asset.id}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onBuyClick}
                className="w-full py-4 rounded-lg font-semibold text-white transition-all hover:opacity-90 text-lg"
                style={{
                  background: 'linear-gradient(135deg, #3788F3 0%, #29abe2 100%)',
                }}
              >
                Invest Now - {asset.price.toLocaleString()} XRP
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-outline">
                  Add to Watchlist
                </button>
                <button className="btn btn-outline">
                  Request Info
                </button>
              </div>
            </div>

            {/* Risk Disclaimer */}
            <div className="mt-6 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-xs text-warning">
                <strong>Risk Disclaimer:</strong> All investments carry risk. Past performance does not guarantee future results.
                Please read our full risk disclosure before investing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};