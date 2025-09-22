import { useState } from "react";
import { CategoryButton } from "../components/CategoryButton";
import { AssetCard } from "../components/AssetCard";
import dummyData from "../data/dummy.json";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter assets based on selected category
  const filteredAssets = selectedCategory
    ? dummyData.assets.filter(asset => asset.categoryId === selectedCategory)
    : dummyData.assets;

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-base-content mb-4 tracking-tight">
            Find your next RWA asset
          </h1>
          <p className="text-lg text-neutral">
            Search RWA assets as per categories
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
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
      </section>

      {/* Assets Grid Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-base-content">
              {selectedCategory
                ? `${dummyData.categories.find(c => c.id === selectedCategory)?.name} Assets`
                : "Featured Assets"}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="btn btn-ghost btn-sm"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Assets Grid */}
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  {...asset}
                  onBuyClick={() => {
                    // Handle buy click
                    console.log(`Buy clicked for ${asset.name}`);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-base-content/60">
                No assets found in this category
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
