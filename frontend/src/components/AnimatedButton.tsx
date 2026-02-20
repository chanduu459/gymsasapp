import { useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-white';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function AnimatedButton({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  showIcon = false,
  className,
  style,
}: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = cn(
    'relative overflow-hidden font-geist-mono inline-flex items-center justify-center gap-2',
    'transition-all duration-300 ease-out-quad',
    {
      'bg-exvia-black text-white hover:bg-exvia-base-black': variant === 'primary',
      'bg-white text-exvia-black border border-exvia-border hover:border-exvia-black': variant === 'secondary',
      'bg-transparent text-exvia-black border border-exvia-black hover:bg-exvia-black hover:text-white': variant === 'outline',
      'bg-transparent text-white border border-white/60 hover:bg-white hover:text-exvia-black': variant === 'outline-white',
      'px-4 py-2 text-xs': size === 'sm',
      'px-6 py-3 text-sm': size === 'md',
      'px-8 py-4 text-base': size === 'lg',
    },
    className
  );

  const content = (
    <>
      <span className="relative overflow-hidden h-5 flex items-center">
        <span
          className={cn(
            'block transition-transform duration-350 ease-out-quad',
            isHovered ? '-translate-y-[150%]' : 'translate-y-0'
          )}
        >
          {children}
        </span>
        <span
          className={cn(
            'absolute inset-0 flex items-center transition-transform duration-350 ease-out-quad',
            isHovered ? 'translate-y-0' : 'translate-y-[150%]'
          )}
        >
          {children}
        </span>
      </span>
      {showIcon && (
        <ArrowRight
          className={cn(
            'w-4 h-4 transition-transform duration-300 ease-out-quad',
            isHovered ? 'translate-x-1' : 'translate-x-0'
          )}
        />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={baseStyles}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseStyles}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </button>
  );
}
