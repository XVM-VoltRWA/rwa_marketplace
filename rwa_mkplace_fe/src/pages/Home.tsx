import { useState } from "react";
import { HiCollection } from 'react-icons/hi';
import { CategoryButton } from "../components/CategoryButton";
import { AssetCard } from "../components/AssetCard";
import { AssetTrendingCard } from "../components/AssetTrendingCard";
import { SectionHeader } from "../components/SectionHeader";
import { HeroBanner } from "../components/HeroBanner";
import { SearchFilterBar } from "../components/SearchFilterBar";
import { TrendingCarousel } from "../components/TrendingCarousel";
import { StatsSection } from "../components/StatsSection";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { RecentlyListed } from "../components/RecentlyListed";
import { AssetQuickViewModal } from "../components/AssetQuickViewModal";
import dummyData from "../data/dummy.json";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedAsset, setSelectedAsset] = useState<typeof dummyData.assets[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter assets based on selected category, search, and price range
  const filteredAssets = dummyData.assets.filter((asset) => {
    const matchesCategory = selectedCategory ? asset.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery ? asset.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesPrice = asset.price >= priceRange.min && asset.price <= priceRange.max;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  // Sort assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
      default:
        return 0; // Keep original order for now
    }
  });

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
  };

  const handleAssetClick = (assetId: string) => {
    const asset = dummyData.assets.find(a => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const handleBuyClick = () => {
    if (selectedAsset) {
      console.log(`Buy clicked for ${selectedAsset.name}`);
      // Handle buy logic here
      handleCloseModal();
    }
  };

  const handleFavoriteClick = (assetId: string) => {
    console.log(`Favorite clicked for asset ${assetId}`);
    // Handle favorite logic here
  };

  // Trending assets for carousel (top 6 by price)
  const trendingAssets = dummyData.assets
    .slice()
    .sort((a, b) => b.price - a.price)
    .slice(0, 6)
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      image: asset.image,
      price: asset.price,
      badge: 'Hot',
      change: '+5.2%'
    }));

  // Recently listed assets (last 6 assets, simulated as newest)
  const recentlyListedAssets = dummyData.assets
    .slice(-6)
    .reverse()
    .map((asset, index) => ({
      id: asset.id,
      name: asset.name,
      image: asset.image,
      price: asset.price,
      category: dummyData.categories.find(cat => cat.id === asset.categoryId)?.name || 'Other',
      listedDate: `${index + 1} day${index === 0 ? '' : 's'} ago`
    }));

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Banner */}
      <HeroBanner featuredAsset={dummyData.assets.find(asset => asset.id === "6") || dummyData.assets[0]} onAssetClick={handleAssetClick} />

      {/* Trending Assets Carousel */}
      <TrendingCarousel
        assets={trendingAssets}
        onAssetClick={handleAssetClick}
        onFavoriteClick={handleFavoriteClick}
      />

      {/* All Assets Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Section Header */}
          <SectionHeader
            icon={<HiCollection className="w-6 h-6 text-primary" />}
            title={selectedCategory
              ? `${dummyData.categories.find((c) => c.id === selectedCategory)?.name} Assets`
              : "All Assets"}
            description={selectedCategory
              ? `Browse ${dummyData.categories.find((c) => c.id === selectedCategory)?.name.toLowerCase()} investments`
              : "Discover premium real-world assets across all categories"}
            rightContent={selectedCategory ? (
              <button onClick={() => setSelectedCategory(null)} className="btn btn-ghost btn-sm">
                Clear Filter
              </button>
            ) : undefined}
          />

          {/* Categories Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {dummyData.categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  iconType={category.iconType}
                  name={category.name}
                  isActive={selectedCategory === category.id}
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <SearchFilterBar
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              onPriceRangeChange={handlePriceRangeChange}
              searchQuery={searchQuery}
              sortBy={sortBy}
            />
          </div>

          {/* Assets Grid */}
          {sortedAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedAssets.map((asset) => (
                <AssetTrendingCard
                  key={asset.id}
                  asset={{
                    ...asset,
                    change: '+3.1%' // Mock change for featured assets
                  }}
                  onAssetClick={handleAssetClick}
                  onFavoriteClick={handleFavoriteClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-base-content/60">No assets found matching your criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* Recently Listed Section */}
      <RecentlyListed
        assets={recentlyListedAssets}
        onAssetClick={handleAssetClick}
        onViewAllClick={() => console.log('View all recent assets')}
      />

      {/* Stats Section */}
      <StatsSection />

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Asset Quick View Modal */}
      <AssetQuickViewModal
        asset={selectedAsset}
        categoryName={selectedAsset ? dummyData.categories.find(cat => cat.id === selectedAsset.categoryId)?.name : ''}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBuyClick={handleBuyClick}
      />
    </div>
  );
};

export default Home;
