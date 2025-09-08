import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ROUTES } from '../router/index';

const MainLayout = () => {
  const location = useLocation();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    // Check for stored wallet connection
    const stored = localStorage.getItem('rwa-wallet');
    if (stored) {
      const walletData = JSON.parse(stored);
      setWalletConnected(true);
      setWalletAddress(walletData.address);
    }
  }, []);

  const connectWallet = () => {
    // TODO: Implement wallet connection
    console.log('Connecting wallet...');
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    localStorage.removeItem('rwa-wallet');
  };

  const navItems = [
    { path: ROUTES.HOME, label: 'Home', icon: '🏠' },
    { path: ROUTES.MARKETPLACE, label: 'Marketplace', icon: '🏪' },
    { path: ROUTES.MY_ASSETS, label: 'My Assets', icon: '📦' },
    { path: ROUTES.CREATE_ASSET, label: 'Create Asset', icon: '✨' },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation */}
      <nav className="bg-base-200 shadow-sm border-b border-base-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center space-x-8">
              <Link to={ROUTES.HOME} className="flex items-center space-x-2">
                <img 
                  src="/LogoWithNameAndTicker2.svg" 
                  alt="RWA Marketplace" 
                  className="h-8 w-auto"
                />
              </Link>
              
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`btn btn-ghost btn-sm ${
                      location.pathname === item.path
                        ? 'btn-primary'
                        : ''
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Wallet connection */}
            <div className="flex items-center space-x-4">
              {walletConnected ? (
                <>
                  <div className="text-sm text-base-content/70">
                    <span className="hidden sm:inline">Connected: </span>
                    <span className="font-mono">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="btn btn-outline btn-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="btn btn-primary btn-sm"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden border-t border-base-300 py-2">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`btn btn-ghost btn-xs ${
                    location.pathname === item.path
                      ? 'btn-primary'
                      : ''
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-base-200 border-t border-base-300 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-base-content/60">
            © 2024 RWA Marketplace. Built on XRPL.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;