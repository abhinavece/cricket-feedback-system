import React, { lazy, Suspense, ComponentType } from 'react';
import { useIsMobile } from '../hooks/useDevice';

interface DeviceRouterProps {
  mobileComponent: React.LazyExoticComponent<ComponentType<any>>;
  desktopComponent: React.LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="spinner"></div>
  </div>
);

export const DeviceRouter: React.FC<DeviceRouterProps> = ({
  mobileComponent: MobileComponent,
  desktopComponent: DesktopComponent,
  fallback = <DefaultFallback />,
  ...props
}) => {
  const isMobile = useIsMobile();
  const Component = isMobile ? MobileComponent : DesktopComponent;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

export const createDeviceComponent = <P extends object>(
  mobileImport: () => Promise<{ default: ComponentType<P> }>,
  desktopImport: () => Promise<{ default: ComponentType<P> }>
) => {
  const MobileComponent = lazy(mobileImport);
  const DesktopComponent = lazy(desktopImport);

  return (props: P & { fallback?: React.ReactNode }) => {
    const { fallback, ...restProps } = props;
    return (
      <DeviceRouter
        mobileComponent={MobileComponent}
        desktopComponent={DesktopComponent}
        fallback={fallback}
        {...restProps}
      />
    );
  };
};

export default DeviceRouter;
