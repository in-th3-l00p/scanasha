import { RouterProvider } from '@tanstack/react-router';
import { useAkashaStore, useRootComponentProps } from '@akashaorg/ui-core-hooks';
import { router } from './app-routes';
import React, { useEffect, useState } from 'react';
import { hasSession } from '@/api';
import { Card, CardContent } from './ui/card';
import { Typography } from './ui/typography';

const App: React.FC<unknown> = () => {
  const { baseRouteName } = useRootComponentProps();
  const {
    data: { authenticatedDID, isAuthenticating },
  } = useAkashaStore();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (authenticatedDID && !isAuthenticating) {
        const authorized = await hasSession();
        setIsAuthorized(authorized);
      }
    };
    checkAuthorization();
  }, [authenticatedDID, isAuthenticating]);

  return (
    <React.Suspense fallback={'loading...'}>
      {authenticatedDID && !isAuthenticating && !isAuthorized && (
        <Card className="p-4 bg-red-800 mb-4">
          <CardContent>
            <Typography variant="sm" bold>
              Some changes requires re-authentification. Please logout and login again to apply them
              correctly.
            </Typography>
          </CardContent>
        </Card>
      )}
      <RouterProvider
        router={router({
          baseRouteName,
        })}
      />
    </React.Suspense>
  );
};

export default App;
