import {
  CatchBoundary,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { ICreateRouter } from '@akashaorg/typings/lib/ui';
import ReviewsListPage from '../reviews-list-page';
import ReviewFormPage from '../review-form-page';

const CREATE_REVIEW = 'Create review';
const LIST_REVIEWS = 'List reviews';

const routes = {
  [CREATE_REVIEW]: '/create-review',
  [LIST_REVIEWS]: '/reviews',
} as const;

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => <div>Not found</div>,
});

const defaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: routes[LIST_REVIEWS], replace: true });
  },
});

const listReviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: routes[LIST_REVIEWS],
  component: () => {
    return (
      <CatchBoundary
        getResetKey={() => 'reviews_reset'}
        errorComponent={() => <div>Not found</div>}
      >
        <ReviewsListPage />
      </CatchBoundary>
    );
  },
});

const createReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: routes[CREATE_REVIEW],
  component: () => {
    return (
      <CatchBoundary
        getResetKey={() => 'create_review_reset'}
        errorComponent={() => <div>Not found</div>}
      >
        <ReviewFormPage />
      </CatchBoundary>
    );
  },
});

const routeTree = rootRoute.addChildren([
  defaultRoute, 
  listReviewsRoute,
  createReviewRoute
]);

const router = ({ baseRouteName, apolloClient }: ICreateRouter) =>
  createRouter({
    routeTree,
    basepath: baseRouteName,
    defaultErrorComponent: ({ error }) => <div>Error: {error.message}</div>,
  });

export { routes, router, CREATE_REVIEW, LIST_REVIEWS };
