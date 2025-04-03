import {
  CatchBoundary,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { ICreateRouter } from '@akashaorg/typings/lib/ui';
import ContractsListPage from '../contract-list-page';
import ContractFormPage from '../contract-form-page';

const ADD_CONTRACT = 'Add contract';
const LIST_CONTRACTS = 'List contracts';

const routes = {
  [ADD_CONTRACT]: '/add-contract',
  [LIST_CONTRACTS]: '/contracts',
} as const;

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => <div>Not found</div>,
});

const defaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: routes[LIST_CONTRACTS], replace: true });
  },
});

const listContractsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: routes[LIST_CONTRACTS],
  component: () => {
    return (
      <CatchBoundary
        getResetKey={() => 'contracts_reset'}
        errorComponent={() => <div>Not found</div>}
      >
        <ContractsListPage />
      </CatchBoundary>
    );
  },
});

const addContractRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: routes[ADD_CONTRACT],
  component: () => {
    return (
      <CatchBoundary
        getResetKey={() => 'add_contract_reset'}
        errorComponent={() => <div>Not found</div>}
      >
        <ContractFormPage />
      </CatchBoundary>
    );
  },
});

const routeTree = rootRoute.addChildren([
  defaultRoute, 
  listContractsRoute,
  addContractRoute
]);

const router = ({ baseRouteName, apolloClient }: ICreateRouter) =>
  createRouter({
    routeTree,
    basepath: baseRouteName,
    defaultErrorComponent: ({ error }) => <div>Error: {error.message}</div>,
  });

export { routes, router, ADD_CONTRACT, LIST_CONTRACTS };
