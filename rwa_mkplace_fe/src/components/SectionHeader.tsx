import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  rightContent?: ReactNode;
}

export const SectionHeader = ({ icon, title, description, rightContent }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-base-content">{title}</h2>
          <p className="text-neutral">{description}</p>
        </div>
      </div>

      {rightContent && (
        <div className="hidden md:flex">
          {rightContent}
        </div>
      )}
    </div>
  );
};