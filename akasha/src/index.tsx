import {
  IAppConfig,
  IntegrationRegistrationOptions,
  MenuItemAreaType,
  LogoTypeSource,
  MenuItemType,
} from '@akashaorg/typings/lib/ui';
import { POLLS, routes } from './components/app-routes';
import { SquareCheck } from 'lucide-react';
import getSDK from '@akashaorg/core-sdk';
import { getComposeClient } from './api';
import { POLL_EDITOR } from './components/app-routes';

/**
 * Changes in this file requires a full reload in the browser!
 */

const SidebarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 stroke-secondaryLight dark:stroke-secondaryDark"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
    />
  </svg>
);

export const initialize = () => {
  const sdk = getSDK();
  const compose = getComposeClient();
  const resources = compose.resources;
  resources.forEach(res => sdk.services.ceramic.setExtraResource(res));
};

export const register = (opts: IntegrationRegistrationOptions): IAppConfig => {
  return {
    rootComponent: () => import('./components'),
    mountsIn: opts.layoutSlots?.applicationSlotId as string,
    menuItems: {
      label: 'Extension Devkit',
      logo: { type: LogoTypeSource.ICON, value: <SidebarIcon /> },
      area: [MenuItemAreaType.UserAppArea],
      subRoutes: [
        {
          label: POLLS,
          index: 0,
          route: routes[POLLS],
          type: MenuItemType.Internal,
        },
        {
          label: POLL_EDITOR,
          index: 1,
          route: routes[POLL_EDITOR],
          type: MenuItemType.Internal,
        },
      ],
    },

    contentBlocks: [
      {
        propertyType: 'poll-block',
        icon: <SquareCheck />,
        displayName: 'Poll block',
        rootComponent: () => import('./extensions/poll-block'),
      },
    ],
  };
};
