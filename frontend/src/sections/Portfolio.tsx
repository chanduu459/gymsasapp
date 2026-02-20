import { } from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { ArrowUpRight } from 'lucide-react';
import { portfolioConfig } from '@/config';

function ProjectCard({ project, index, isVisible }: { project: { title: string; category: string; year: string; image: string; featured?: boolean }; index: number; isVisible: boolean }) {
  return (
    <div
      className={cn(
        'group cursor-pointer transition-all duration-700 ease-out-quart',
        project.featured ? 'lg:col-span-2' : '',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative overflow-hidden bg-exvia-subtle">
        <div className={cn(
          'aspect-[4/3]',
          project.featured && 'lg:aspect-[16/9]'
        )}>
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out-cubic group-hover:scale-105"
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-exvia-black/0 group-hover:bg-exvia-black/20 transition-colors duration-500" />

        {/* Year Badge */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1.5 text-xs font-geist-mono bg-white/90 backdrop-blur-sm rounded-full text-exvia-black">
            {project.year}
          </span>
        </div>

        {/* Arrow Icon */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-exvia-black" />
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="mt-4 space-y-1">
        <h3 className="text-lg font-semibold text-exvia-black group-hover:text-exvia-black/80 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-exvia-black/50">{project.category}</p>
      </div>
    </div>
  );
}

export function Portfolio() {
  if (!portfolioConfig.heading && portfolioConfig.projects.length === 0) return null;

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { containerRef: gridRef, visibleItems } = useStaggerAnimation(portfolioConfig.projects.length + 1, 120);

  return (
    <section id="portfolio" className="w-full py-24 lg:py-32 bg-exvia-subtle/30">
      <div className="container-large px-6 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="max-w-3xl mb-16">
          {portfolioConfig.label && (
            <div
              className={cn(
                'transition-all duration-800 ease-out-quart',
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <span className="text-xs font-geist-mono uppercase tracking-widest text-exvia-black/50">
                {portfolioConfig.label}
              </span>
            </div>
          )}

          {portfolioConfig.heading && (
            <h2
              className={cn(
                'text-h2 font-semibold text-exvia-black mt-4 transition-all duration-800 ease-out-quart',
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: '100ms' }}
            >
              {portfolioConfig.heading}
            </h2>
          )}

          {portfolioConfig.description && (
            <p
              className={cn(
                'mt-6 text-lg text-exvia-black/60 leading-relaxed transition-all duration-800 ease-out-quart',
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: '200ms' }}
            >
              {portfolioConfig.description}
            </p>
          )}
        </div>

        {/* Projects Grid - Bento Style */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1: Featured (2 cols) + Small (1 col) */}
          {portfolioConfig.projects[0] && (
            <div className="lg:col-span-2 md:col-span-1">
              <ProjectCard
                project={portfolioConfig.projects[0]}
                index={0}
                isVisible={visibleItems[0]}
              />
            </div>
          )}
          {portfolioConfig.projects[1] && (
            <ProjectCard
              project={portfolioConfig.projects[1]}
              index={1}
              isVisible={visibleItems[1]}
            />
          )}

          {/* Row 2: Two small + CTA card */}
          {portfolioConfig.projects[2] && (
            <ProjectCard
              project={portfolioConfig.projects[2]}
              index={2}
              isVisible={visibleItems[2]}
            />
          )}
          {portfolioConfig.projects[3] && (
            <ProjectCard
              project={portfolioConfig.projects[3]}
              index={3}
              isVisible={visibleItems[3]}
            />
          )}

          {/* Decorative CTA Card */}
          {portfolioConfig.cta.heading && (
            <div
              className={cn(
                'relative overflow-hidden bg-exvia-black rounded-lg p-8 flex flex-col justify-between transition-all duration-700 ease-out-quart aspect-[4/3]',
                visibleItems[portfolioConfig.projects.length] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: '400ms' }}
            >
              <div>
                {portfolioConfig.cta.label && (
                  <span className="text-xs font-geist-mono uppercase tracking-widest text-white/50">
                    {portfolioConfig.cta.label}
                  </span>
                )}
                <h3 className="text-2xl font-semibold text-white mt-3 leading-tight">
                  {portfolioConfig.cta.heading}
                </h3>
              </div>
              {portfolioConfig.cta.linkText && (
                <a href={portfolioConfig.cta.linkHref || '#contact'} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group">
                  <span className="text-sm font-medium">{portfolioConfig.cta.linkText}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
              {/* Decorative circle */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            </div>
          )}

          {/* Row 3: Full width featured */}
          {portfolioConfig.projects[4] && (
            <div className="lg:col-span-3 md:col-span-2">
              <ProjectCard
                project={portfolioConfig.projects[4]}
                index={5}
                isVisible={visibleItems[4]}
              />
            </div>
          )}
        </div>

        {/* View All Button */}
        {portfolioConfig.viewAllLabel && (
          <div
            className={cn(
              'mt-16 text-center transition-all duration-800 ease-out-quart',
              visibleItems[portfolioConfig.projects.length] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
            style={{ transitionDelay: '600ms' }}
          >
            <button className="group inline-flex items-center gap-2 text-sm font-geist-mono text-exvia-black hover:text-exvia-black/70 transition-colors">
              <span>{portfolioConfig.viewAllLabel}</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
