import { lazy, Suspense, ComponentType } from 'react';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

// Generic loading fallback for components
export const ComponentLoadingFallback = ({ height = '200px', className = '' }: { height?: string; className?: string }) => (
  <div className={`flex items-center justify-center ${className}`} style={{ minHeight: height }}>
    <div className="text-center space-y-3">
      <SkeletonLoader className="w-32 h-6 mx-auto" />
      <SkeletonLoader className="w-24 h-4 mx-auto" />
      <div className="text-sm text-gray-500" role="status" aria-live="polite">
        Loading component...
        <span className="block text-xs mt-1" lang="ml">കോംപോണന്റ് ലോഡ് ചെയ്യുന്നു...</span>
      </div>
    </div>
  </div>
);

// PDF Viewer loading fallback
export const PDFViewerLoadingFallback = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <SkeletonLoader className="w-8 h-8" />
        <SkeletonLoader className="w-20 h-4" />
        <SkeletonLoader className="w-8 h-8" />
      </div>
      <div className="flex items-center space-x-2">
        <SkeletonLoader className="w-8 h-8" />
        <SkeletonLoader className="w-12 h-4" />
        <SkeletonLoader className="w-8 h-8" />
        <SkeletonLoader className="w-16 h-8" />
      </div>
      <SkeletonLoader className="w-20 h-8" />
    </div>
    <div className="border border-gray-200 rounded-lg">
      <SkeletonLoader className="w-full h-96" />
    </div>
    <div className="text-sm text-gray-500 text-center" role="status" aria-live="polite">
      Loading PDF viewer...
      <span className="block text-xs mt-1" lang="ml">PDF വ്യൂവർ ലോഡ് ചെയ്യുന്നു...</span>
    </div>
  </div>
);

// Video Player loading fallback
export const VideoPlayerLoadingFallback = () => (
  <div className="relative bg-black rounded-lg overflow-hidden">
    <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading video player...</p>
        <p className="text-sm mt-1" lang="ml">വീഡിയോ പ്ലേയർ ലോഡ് ചെയ്യുന്നു...</p>
      </div>
    </div>
  </div>
);

// Calendar loading fallback
export const CalendarLoadingFallback = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <SkeletonLoader className="w-32 h-6" />
      <div className="flex space-x-2">
        <SkeletonLoader className="w-8 h-8" />
        <SkeletonLoader className="w-8 h-8" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }, (_, i) => (
        <SkeletonLoader key={i} className="w-10 h-10" />
      ))}
    </div>
    <div className="text-sm text-gray-500 text-center" role="status" aria-live="polite">
      Loading calendar...
      <span className="block text-xs mt-1" lang="ml">കലണ്ടർ ലോഡ് ചെയ്യുന്നു...</span>
    </div>
  </div>
);

// Higher-order component for lazy loading with custom fallback
export function withLazyLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  fallback?: ComponentType,
  fallbackProps?: any
) {
  const LazyComponent = lazy(async () => {
    const module = await importFn();
    // Handle both default and named exports
    return 'default' in module ? module : { default: module as T };
  });

  const FallbackComponent = fallback || ComponentLoadingFallback;

  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={<FallbackComponent {...fallbackProps} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy loaded heavy components
export const LazyPDFViewer = withLazyLoading(
  () => import('../components/notes/PDFViewer').then(module => ({ default: module.PDFViewer })),
  PDFViewerLoadingFallback
);

export const LazyVideoPlayer = withLazyLoading(
  () => import('../components/recordings/VideoPlayer').then(module => ({ default: module.VideoPlayer })),
  VideoPlayerLoadingFallback
);

export const LazyCalendarView = withLazyLoading(
  () => import('../components/ui/CalendarView').then(module => ({ default: module.CalendarView })),
  CalendarLoadingFallback
);

// Lazy load exercise components
export const LazyExerciseComponent = withLazyLoading(
  () => import('../components/exercises/ExerciseComponent').then(module => ({ default: module.ExerciseComponent })),
  () => <ComponentLoadingFallback height="300px" />
);

// Lazy load accessibility settings (heavy component with many features)
export const LazyAccessibilitySettings = withLazyLoading(
  () => import('../components/accessibility/AccessibilitySettings').then(module => ({ default: module.AccessibilitySettings })),
  () => <ComponentLoadingFallback height="400px" />
);