import { useState } from 'react';

const CreateAsset = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_xrp: '',
    token_currency: '',
    image_url: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement asset creation
    console.log('Creating asset:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-base-content mb-6">
        ✨ Create New Asset
      </h1>
      
      <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl">
        <div className="card-body space-y-6">
          <div className="form-control">
            <label htmlFor="name" className="label">
              <span className="label-text">Asset Name</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
              placeholder="e.g., Luxury Apartment Token"
            />
          </div>

          <div className="form-control">
            <label htmlFor="description" className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="textarea textarea-bordered w-full"
              placeholder="Describe your asset..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label htmlFor="price_xrp" className="label">
                <span className="label-text">Price (XRP)</span>
              </label>
              <input
                type="number"
                id="price_xrp"
                name="price_xrp"
                value={formData.price_xrp}
                onChange={handleChange}
                required
                step="0.000001"
                min="0"
                className="input input-bordered w-full"
                placeholder="1000"
              />
            </div>

            <div className="form-control">
              <label htmlFor="token_currency" className="label">
                <span className="label-text">Token Currency Code</span>
              </label>
              <input
                type="text"
                id="token_currency"
                name="token_currency"
                value={formData.token_currency}
                onChange={handleChange}
                required
                maxLength={3}
                className="input input-bordered w-full"
                placeholder="e.g., RET"
              />
            </div>
          </div>

          <div className="form-control">
            <label htmlFor="image_url" className="label">
              <span className="label-text">Image URL (Optional)</span>
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="card-actions justify-end gap-4">
            <button
              type="button"
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              Create Asset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateAsset;