import { HiTrendingUp, HiCollection, HiUsers, HiCheck } from 'react-icons/hi';

interface Stat {
  icon: React.ReactNode;
  value: string;
  label: string;
  change?: string;
}

export const StatsSection = () => {
  const stats: Stat[] = [
    {
      icon: <HiTrendingUp className="w-8 h-8" />,
      value: "$2.4M+",
      label: "Total Volume Traded",
      change: "+12.5%"
    },
    {
      icon: <HiCollection className="w-8 h-8" />,
      value: "547",
      label: "Assets Listed",
      change: "+23"
    },
    {
      icon: <HiUsers className="w-8 h-8" />,
      value: "1,247",
      label: "Active Investors",
      change: "+156"
    },
    {
      icon: <HiCheck className="w-8 h-8" />,
      value: "98.2%",
      label: "Success Rate",
      change: "+0.8%"
    }
  ];

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-base-content mb-4">
            Trusted by Thousands of Investors
          </h2>
          <p className="text-lg text-neutral max-w-2xl mx-auto">
            Join a growing community of investors discovering the future of real-world asset ownership.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-base-200/50 backdrop-blur-sm border border-base-200/50 rounded-xl p-6 hover:bg-base-200/70 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                  {stat.icon}
                </div>
                {stat.change && (
                  <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>

              <div className="text-3xl font-bold text-base-content mb-2">
                {stat.value}
              </div>

              <div className="text-sm text-neutral">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-neutral mb-6">Secured and audited by leading blockchain security firms</p>

          <div className="flex justify-center items-center gap-8 opacity-50 hover:opacity-70 transition-opacity">
            <div className="text-neutral font-semibold">CertiK</div>
            <div className="text-neutral font-semibold">Chainlink</div>
            <div className="text-neutral font-semibold">OpenZeppelin</div>
            <div className="text-neutral font-semibold">XRPL Foundation</div>
          </div>
        </div>
      </div>
    </section>
  );
};