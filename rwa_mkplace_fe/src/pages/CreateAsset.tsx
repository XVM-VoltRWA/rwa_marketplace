import { useState, useRef } from "react";
import { createNFT } from "../services/nftService";
import type { NFTMetadata, CreateNFTResponse } from "../services/nftService";
import { useWalletStore } from "../store/walletStore";
import { NftSuccessModal } from "../components/NftSuccessModal";

interface Property {
  id: string;
  key: string;
  value: string;
}

const CreateAsset = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    external_link: "",
    valuation: "",
    image_url: "",
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [nftResult, setNftResult] = useState<CreateNFTResponse | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get wallet state
  const { isConnected, walletAddress, xummUserToken } = useWalletStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    setIsLoading(true);

    // Build metadata object
    const metadata: NFTMetadata = {
      external_link: formData.external_link,
      description: formData.description,
      category: formData.category,
      properties: properties.reduce((acc, prop) => {
        if (prop.key && prop.value) {
          acc[prop.key] = prop.value;
        }
        return acc;
      }, {} as Record<string, string>),
      valuation: formData.valuation ? parseFloat(formData.valuation) : undefined,
    };

    // Call create-nft function via service
    try {
      const result = await createNFT({
        name: formData.name,
        image_url: formData.image_url || "https://via.placeholder.com/400x400?text=No+Image",
        owner_address: walletAddress,
        metadata,
        xumm_user_token: xummUserToken || undefined,
      });

      console.log("NFT Creation Result:", result);

      if (result.success) {
        setNftResult(result);
        setShowSuccess(true);
      } else {
        alert("Error creating NFT: " + result.error);
      }
    } catch (error) {
      console.error("Error creating NFT:", error);
      alert("Error creating NFT: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addProperty = () => {
    setProperties([...properties, { id: Date.now().toString(), key: "", value: "" }]);
  };

  const updateProperty = (id: string, field: "key" | "value", value: string) => {
    setProperties(properties.map((prop) => (prop.id === id ? { ...prop, [field]: value } : prop)));
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((prop) => prop.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // TODO: Upload file to storage service
    // For now, create a local URL for preview
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-base-content mb-4">Create New Asset</h1>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            Transform your real-world assets into NFTs on the XRP Ledger. This information will be
            displayed publicly on the asset's detail page.
          </p>

          {/* Wallet Connection Status */}
          {!isConnected && (
            <div className="alert alert-warning max-w-md mx-auto mt-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span>Please connect your wallet to create assets</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Live Preview */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-base-content">Live Preview</h2>
              </div>

              <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                <figure className="relative">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={formData.name || "Asset preview"}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-base-300 to-base-200 flex items-center justify-center">
                      <div className="text-center">
                        <svg
                          className="w-16 h-16 text-base-content/30 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-base-content/50 text-sm">
                          Upload an image to see preview
                        </span>
                      </div>
                    </div>
                  )}
                  {formData.category && (
                    <div className="absolute top-4 right-4">
                      <div className="badge badge-primary badge-lg">{formData.category}</div>
                    </div>
                  )}
                </figure>

                <div className="card-body p-6">
                  <h3 className="card-title text-xl mb-2">{formData.name || "Asset Name"}</h3>

                  <p className="text-base-content/70 text-sm mb-4 line-clamp-2">
                    {formData.description || "Asset description will appear here..."}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-base-content/60 uppercase tracking-wide">
                        Valuation
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {formData.valuation ? `$${formData.valuation}` : "$0"}
                        <span className="text-sm text-base-content/60 ml-1">USDC</span>
                      </div>
                    </div>
                    <div className="badge badge-outline badge-lg">NFT</div>
                  </div>

                  {properties.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-base-content/60 uppercase tracking-wide mb-2">
                        Properties
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {properties.slice(0, 3).map(
                          (prop) =>
                            prop.key &&
                            prop.value && (
                              <div key={prop.id} className="badge badge-secondary badge-sm">
                                {prop.key}: {prop.value}
                              </div>
                            )
                        )}
                        {properties.length > 3 && (
                          <div className="badge badge-ghost badge-sm">
                            +{properties.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary btn-block">
                    <svg
                      className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <span className="hidden sm:inline">Purchase Asset</span>
                    <span className="sm:hidden">Purchase</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="order-1 lg:order-2">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-primary rounded-full"></div>
                  <h2 className="text-2xl font-bold text-base-content">Asset Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Image Upload Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-base-content mb-2">Asset Image</h3>
                      <p className="text-sm text-base-content/60">
                        Upload a high-quality image of your asset
                      </p>
                    </div>

                    <div className="form-control">
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                          dragActive
                            ? "border-primary bg-primary/10 scale-[1.02]"
                            : "border-base-300 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.image_url ? (
                          <div className="space-y-4">
                            <img
                              src={formData.image_url}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <div>
                              <p className="text-sm font-medium text-success">
                                Image uploaded successfully!
                              </p>
                              <p className="text-xs text-base-content/50 mt-1">
                                Click to change image
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                              <svg
                                className="w-10 h-10 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-base font-medium text-base-content mb-1">
                                Upload asset image
                              </p>
                              <p className="text-sm text-base-content/60">
                                Drag and drop or click to browse
                              </p>
                              <p className="text-xs text-base-content/40 mt-2">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-base-content mb-2">
                        Basic Information
                      </h3>
                      <p className="text-sm text-base-content/60">
                        Provide essential details about your asset
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-medium">
                            Asset Name <span className="text-error">*</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          className="input input-bordered input-lg w-full"
                          placeholder="e.g., [1 of 10] SEIKO COLLECTOR'S WATCH"
                        />
                      </div>

                      {/* Category */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Category</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="select select-bordered select-lg w-full"
                        >
                          <option value="">Select category</option>
                          <option value="Collectibles">🏆 Collectibles</option>
                          <option value="Real Estate">🏠 Real Estate</option>
                          <option value="Art">🎨 Art</option>
                          <option value="Vehicles">🚗 Vehicles</option>
                          <option value="Luxury Goods">💎 Luxury Goods</option>
                          <option value="Other">📦 Other</option>
                        </select>
                      </div>

                      {/* External Link */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">External Link</span>
                          <span className="label-text-alt">Optional</span>
                        </label>
                        <input
                          type="url"
                          name="external_link"
                          value={formData.external_link}
                          onChange={handleChange}
                          autoComplete="off"
                          className="input input-bordered input-lg w-full"
                          placeholder="https://your-website.com/asset"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Description <span className="text-error">*</span>
                        </span>
                        <span className="label-text-alt">
                          {formData.description.length}/500 characters
                        </span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        maxLength={500}
                        className="textarea textarea-bordered textarea-lg w-full"
                        placeholder="Provide a detailed description of your asset, including its condition, provenance, and any unique features..."
                      />
                    </div>
                  </div>

                  {/* Properties Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-base-content mb-2">Properties</h3>
                      <p className="text-sm text-base-content/60">
                        Add custom attributes to describe your asset
                      </p>
                    </div>

                    <div className="space-y-4">
                      {properties.map((property) => (
                        <div
                          key={property.id}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-base-200 rounded-lg"
                        >
                          <input
                            type="text"
                            placeholder="Property name (e.g., Brand)"
                            value={property.key}
                            onChange={(e) => updateProperty(property.id, "key", e.target.value)}
                            className="input input-bordered"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Value (e.g., Rolex)"
                              value={property.value}
                              onChange={(e) => updateProperty(property.id, "value", e.target.value)}
                              className="input input-bordered flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeProperty(property.id)}
                              className="btn btn-square btn-outline btn-error btn-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addProperty}
                        className="btn btn-outline btn-block"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Property
                      </button>
                    </div>
                  </div>

                  {/* Valuation Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-base-content mb-2">
                        Asset Valuation
                      </h3>
                      <p className="text-sm text-base-content/60">
                        Set the minimum valuation for your asset
                      </p>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Minimum Valuation <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join">
                        <span className="join-item btn btn-disabled">$</span>
                        <input
                          type="number"
                          name="valuation"
                          value={formData.valuation}
                          onChange={handleChange}
                          required
                          step="0.01"
                          min="0"
                          className="input input-bordered input-lg join-item flex-1"
                          placeholder="15000.00"
                        />
                        <span className="join-item btn btn-disabled">USDC</span>
                      </div>
                      <div className="label">
                        <span className="label-text-alt">
                          This represents the minimum value of your asset
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-8 border-t border-base-300">
                    <button
                      type="button"
                      className="btn btn-outline btn-lg flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg flex-1"
                      disabled={!isConnected || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          <span className="hidden sm:inline">Creating Asset...</span>
                          <span className="sm:hidden">Creating...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span className="hidden sm:inline">Create Asset NFT</span>
                          <span className="sm:hidden">Create NFT</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <NftSuccessModal
        isOpen={showSuccess}
        nftResult={nftResult}
        onClose={() => {
          setShowSuccess(false);
          setNftResult(null);
        }}
        onCreateAnother={() => {
          setShowSuccess(false);
          setNftResult(null);
          // Reset form
          setFormData({
            name: "",
            description: "",
            category: "",
            external_link: "",
            valuation: "",
            image_url: "",
          });
          setProperties([]);
        }}
      />
    </div>
  );
};

export default CreateAsset;
