import { useState, type ElementType } from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useServiceParallax } from '@/hooks/useMouseParallax';
import { servicesConfig } from '@/config';
import { 
  Compass, 
  PenTool, 
  Layout, 
  Code, 
  Palette, 
  Monitor, 
  Camera, 
  Layers,
  Circle 
} from 'lucide-react';

const iconMap: Record<string, ElementType> = {
  Compass,
  PenTool,
  Layout,
  Code,
  Palette,
  Monitor,
  Camera,
  Layers,
  Circle,
};

function getIcon(iconName: string): ElementType {
  return iconMap[iconName] || Circle;
}

interface ServiceCardProps {
  service: { iconName: string; title: string; description: string; image: string };
  index: number;
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { containerRef, getTransform } = useServiceParallax();
  const Icon = getIcon(service.iconName);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative p-8 lg:p-10 border-t border-exvia-border transition-colors duration-300 cursor-pointer',
        'hover:bg-exvia-subtle/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 flex items-center justify-center border border-exvia-border rounded-lg bg-white">
            <Icon className="w-5 h-5 text-exvia-black" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <h3 className="text-h5 font-semibold text-exvia-black">{service.title}</h3>
          <p className="text-sm text-exvia-black/60 leading-relaxed max-w-md">
            {service.description}
          </p>
        </div>

        {/* Index Number */}
        <div className="hidden lg:block text-xs font-geist-mono text-exvia-black/30">
          0{index + 1}
        </div>
      </div>

      {/* Hover Image */}
      <div
        className={cn(
          'absolute right-8 top-1/2 -translate-y-1/2 w-48 h-32 lg:w-64 lg:h-40 overflow-hidden rounded-lg shadow-xl pointer-events-none z-10',
          'transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        style={getTransform(50, 6)}
      >
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

export function Services() {
  if (!servicesConfig.heading && servicesConfig.services.length === 0) return null;

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: servicesRef, isVisible: servicesVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="services" className="w-full py-24 lg:py-32 bg-white">
      <div className="container-large px-6 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="max-w-2xl mb-16">
          {servicesConfig.label && (
            <div
              className={cn(
                'transition-all duration-800 ease-out-quart',
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <span className="text-xs font-geist-mono uppercase tracking-widest text-exvia-black/50">
                {servicesConfig.label}
              </span>
            </div>
          )}

          {servicesConfig.heading && (
            <h2
              className={cn(
                'text-h2 font-semibold text-exvia-black mt-4 transition-all duration-800 ease-out-quart',
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: '100ms' }}
            >
              {servicesConfig.heading}
            </h2>
          )}
        </div>

        {/* Services Grid */}
        {servicesConfig.services.length > 0 && (
          <div
            ref={servicesRef}
            className={cn(
              'border-b border-exvia-border transition-all duration-800 ease-out-quart',
              servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            {servicesConfig.services.map((service, index) => (
              <ServiceCard key={service.title} service={service} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
