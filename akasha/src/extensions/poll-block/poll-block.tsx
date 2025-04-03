import {
  type BlockInstanceMethods,
  type CreateContentBlock,
  type ContentBlockRootProps,
} from '@akashaorg/typings/lib/ui';
import * as React from 'react';
import PollForm, { PollHandlerRefType } from '../../components/poll-form';
import {
  AkashaContentBlockBlockDef,
} from '@akashaorg/typings/lib/sdk/graphql-types-new';
import { BlockLabeledValue } from '@akashaorg/typings/lib/sdk/graphql-types-new';
import {
  useCreateContentBlockMutation,
  useGetAppsQuery,
} from '@akashaorg/ui-core-hooks/lib/generated/apollo';
import getSDK from '@akashaorg/core-sdk';
import { selectLatestRelease } from '@akashaorg/ui-core-hooks/lib/selectors/get-apps-query';
import { createPoll, hasSession } from '../../api';
import { useEffect, useState } from 'react';
import { useAkashaStore } from '@akashaorg/ui-core-hooks';
import { Typography } from '@/components/ui/typography';
import { Card, CardContent } from '@/components/ui/card';

export const PollBlock = (
  props: ContentBlockRootProps & { blockRef?: React.RefObject<BlockInstanceMethods> },
) => {
  const [createContentBlock] = useCreateContentBlockMutation();
  const pollRef = React.useRef<PollHandlerRefType>(null);
  const sdk = React.useRef(getSDK());
  const retryCount = React.useRef<number>(0);
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

  const appReq = useGetAppsQuery({
    variables: {
      first: 1,
      filters: { where: { name: { equalTo: props.blockInfo.appName } } },
    },
  });

  const appRelease = selectLatestRelease(appReq.data!);

  const createBlock = React.useCallback(
    async ({ nsfw }: CreateContentBlock) => {
      const pollFormValues = await pollRef.current?.getFormValues();
      if (!pollFormValues) {
        return {
          response: {
            blockID: '',
            error: 'Invalid poll form values',
            editorMentions: [],
          },
          blockInfo: props.blockInfo,
          retryCount: retryCount.current,
        };
      }

      const optionsWithIDs = pollFormValues.options.map((option, index) => ({
        id: index.toString(),
        name: option.value,
      }));

      const res = await createPoll(
        pollFormValues.title,
        pollFormValues.description,
        optionsWithIDs,
      );

      if ('error' in res) {
        console.error(res.error);
        return {
          response: {
            blockID: '',
            error: res.error,
          },
          blockInfo: props.blockInfo,
          retryCount: retryCount,
        };
      }

      const pollId = res.data?.createPoll.document.id;

      const contentBlockValue: BlockLabeledValue = {
        label: props.blockInfo.appName,
        propertyType: props.blockInfo.propertyType,
        value: JSON.stringify({ pollId }),
      };
      try {
        const resp = await createContentBlock({
          variables: {
            i: {
              content: {
                appVersionID: appRelease?.node?.id,
                createdAt: new Date().toISOString(),
                content: [contentBlockValue],
                active: true,
                kind: AkashaContentBlockBlockDef.Text,
                nsfw,
              },
            },
          },
          context: { source: sdk.current.services.gql.contextSources.composeDB },
        });
        return {
          response: {
            blockID: resp.data?.createAkashaContentBlock?.document.id as string,
            error: '',
          },
          blockInfo: props.blockInfo,
          retryCount: retryCount.current,
        };
      } catch (err) {
        console.error({ err });
        return {
          response: {
            blockID: '',
            error: err.message,
          },
          blockInfo: props.blockInfo,
          retryCount: retryCount.current,
        };
      }
    },
    [createContentBlock, props.blockInfo, appRelease?.node?.id],
  );

  const retryCreate = React.useCallback(
    (arg: CreateContentBlock) => {
      return createBlock(arg);
    },
    [createBlock],
  );

  React.useImperativeHandle(
    props.blockRef,
    () => ({
      createBlock,
      retryBlockCreation: retryCreate,
    }),
    [createBlock, retryCreate],
  );

  return (
    <>
      {!isAuthorized && (
        <Card>
          <CardContent>
            <Typography variant="sm" bold>
              You need to re-login to be able to create polls!
            </Typography>
          </CardContent>
        </Card>
      )}
      {isAuthorized && <PollForm ref={pollRef} hideSubmitButton />}
    </>
  );
};
