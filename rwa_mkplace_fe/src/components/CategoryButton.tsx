import { ReactNode } from 'react';
import {
  HiOutlineArchive,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineHome,
  HiOutlineGlobeAlt,
  HiOutlineTicket,
  HiOutlineShoppingBag,
  HiOutlineLink,
} from 'react-icons/hi';
import { GiCutDiamond } from 'react-icons/gi';

interface CategoryButtonProps {
  iconType: string;
  name: string;
  isActive?: boolean;
  onClick?: () => void;
}

const getIcon = (iconType: string): ReactNode => {
  switch (iconType) {
    case 'collectibles':
      return <HiOutlineArchive className="w-6 h-6" />;
    case 'credit':
      return <HiOutlineCreditCard className="w-6 h-6" />;
    case 'commodities':
      return <GiCutDiamond className="w-6 h-6" />;
    case 'stocks':
      return <HiOutlineChartBar className="w-6 h-6" />;
    case 'real-estate':
      return <HiOutlineHome className="w-6 h-6" />;
    case 'esg':
      return <HiOutlineGlobeAlt className="w-6 h-6" />;
    case 'royalties':
      return <HiOutlineCurrencyDollar className="w-6 h-6" />;
    case 'membership':
      return <HiOutlineTicket className="w-6 h-6" />;
    case 'partner-store':
      return <HiOutlineShoppingBag className="w-6 h-6" />;
    case 'l1l2':
      return <HiOutlineLink className="w-6 h-6" />;
    default:
      return <HiOutlineArchive className="w-6 h-6" />;
  }
};

export const CategoryButton = ({ iconType, name, isActive = false, onClick }: CategoryButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-3 rounded-xl transition-all hover:scale-105`}
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
        isActive
          ? 'bg-base-200 text-primary shadow-lg shadow-primary/20'
          : 'bg-base-200 text-neutral hover:bg-base-200/80 hover:text-base-content/80'
      }`}>
        {getIcon(iconType)}
      </div>
      <span className={`text-xs font-medium ${
        isActive ? 'text-primary' : 'text-neutral'
      }`}>{name}</span>
    </button>
  );
};