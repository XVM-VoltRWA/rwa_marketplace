import { useState } from 'react';
import { HiMail, HiCheck, HiSparkles } from 'react-icons/hi';

export const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    setIsLoading(false);
    setEmail('');
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-base-200 to-base-300 rounded-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-xl"></div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <HiSparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Early Access</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
                Stay Ahead of the Market
              </h2>

              <p className="text-lg text-neutral max-w-2xl mx-auto">
                Get exclusive access to new asset listings, market insights, and investment opportunities before they go public.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <HiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral w-5 h-5" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input input-bordered input-lg w-full pl-12 bg-base-100/50 border-base-200/50 focus:border-primary text-base-content placeholder-neutral/60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="btn btn-primary btn-lg px-8"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Join Waitlist'
                    )}
                  </button>
                </div>

                <p className="text-xs text-neutral/60 mt-4 text-center">
                  No spam, unsubscribe at any time. We respect your privacy.
                </p>
              </form>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/20 rounded-full mb-4">
                  <HiCheck className="w-8 h-8 text-success" />
                </div>

                <h3 className="text-xl font-bold text-base-content mb-2">
                  Welcome to the waitlist!
                </h3>

                <p className="text-neutral">
                  We'll notify you about new opportunities and market insights.
                </p>
              </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base-content mb-1">Early Access</h4>
                <p className="text-sm text-neutral">Be first to invest in premium assets</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base-content mb-1">Market Insights</h4>
                <p className="text-sm text-neutral">Weekly analysis and trends</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base-content mb-1">Exclusive Deals</h4>
                <p className="text-sm text-neutral">Member-only pricing and offers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};