// Copyright 2017-2021 @polkadot/react-components authors & contributors
// and @canvas-ui/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { registry } from '@canvas-ui/react-api';
import React, { useCallback, useRef, useState } from 'react';

import { SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { createType } from '@polkadot/types';
import { DispatchError } from '@polkadot/types/interfaces';
import jsonrpc from '@polkadot/types/interfaces/jsonrpc';
import { ITuple, SignerPayloadJSON } from '@polkadot/types/types';
import { u8aToString } from '@polkadot/util';

import { BareProps } from '../types';
import { STATUS_COMPLETE } from '@canvas-ui/react-api/Status/constants';
import { QueueProvider } from '@canvas-ui/react-api/Status/Context';
import { ActionStatus, PartialQueueTxExtrinsic, PartialQueueTxRpc, QueueStatus, QueueTx, QueueTxExtrinsic, QueueTxRpc, QueueTxStatus, SignerCallback } from '@canvas-ui/react-api/Status/types';

interface Props extends BareProps {
  children: React.ReactNode;
}

interface StatusCount {
  count: number;
  status: ActionStatus;
}

let nextId = 0;

const REMOVE_TIMEOUT = 7500;
const SUBMIT_RPC = jsonrpc.author.submitAndWatchExtrinsic;

function mergeStatus (status: ActionStatus[]): ActionStatus[] {
  return status
    .reduce((result: StatusCount[], status): StatusCount[] => {
      const prev = result.find(({ status: prev }) => prev.action === status.action && prev.status === status.status);

      if (prev) {
        prev.count++;
      } else {
        result.push({ count: 1, status });
      }

      return result;
    }, [])
    .map(({ count, status }): ActionStatus =>
      count === 1
        ? status
        : { ...status, action: `${status.action} (x${count})` }
    );
}

function extractEvents (result?: SubmittableResult): ActionStatus[] {
  return mergeStatus(
    ((result && result.events) || [])
      // filter events handled globally, or those we are not interested in, these are
      // handled by the global overview, so don't add them here
      .filter((record): boolean => !!record.event && record.event.section !== 'democracy')
      .map(({ event: { data, method, section }, topics }): ActionStatus => {
        if (section === 'system' && method === 'ExtrinsicFailed') {
          const [dispatchError] = data as unknown as ITuple<[DispatchError]>;
          let message = dispatchError.type;

          if (dispatchError.isModule) {
            try {
              const mod = dispatchError.asModule;
              const error = registry.findMetaError(new Uint8Array([mod.index.toNumber(), mod.error.toNumber()]));

              message = `${error.section}.${error.name}`;
            } catch (error) {
              // swallow
            }
          }

          return {
            action: `${section}.${method}`,
            message,
            status: 'error'
          };
        }

        if (section === 'contracts' && method === 'ContractExecution' && topics.length > 0) {
          // find the name of the contract event. Needs improvement.
          const message = topics.map(u8aToString)
            .filter((topic: string) => topic.includes('::'))
            ?.pop() ?? '';

          return {
            action: `${section}.${method}`,
            message,
            status: 'event'
          };
        }

        return {
          action: `${section}.${method}`,
          message: 'extrinsic event',
          status: 'event'
        };
      })
  );
}

function Queue ({ children }: Props): React.ReactElement<Props> {
  const [stqueue, _setStQueue] = useState<QueueStatus[]>([]);
  const [txqueue, _setTxQueue] = useState<QueueTx[]>([]);
  const stRef = useRef(stqueue);
  const txRef = useRef(txqueue);

  const setStQueue = useCallback(
    (st: QueueStatus[]): void => {
      stRef.current = st;
      _setStQueue(st);
    },
    []
  );
  const setTxQueue = useCallback(
    (tx: QueueTx[]): void => {
      txRef.current = tx;
      _setTxQueue(tx);
    },
    []
  );
  const addToTxQueue = useCallback(
    (value: QueueTxExtrinsic | QueueTxRpc | QueueTx): void => {
      const id = ++nextId;
      const removeItem = (): void =>
        setTxQueue([...txRef.current.map((item): QueueTx =>
          item.id === id
            ? { ...item, status: 'completed' }
            : item
        )]);

      setTxQueue([...txRef.current, {
        ...value,
        id,
        removeItem,
        rpc: (value as QueueTxRpc).rpc || SUBMIT_RPC,
        status: 'queued'
      }]);
    },
    [setTxQueue]
  );
  const queueAction = useCallback(
    (_status: ActionStatus | ActionStatus[]): void => {
      const status = Array.isArray(_status) ? _status : [_status];

      status.length && setStQueue([
        ...stRef.current,
        ...(status.map((item): QueueStatus => {
          const id = ++nextId;
          const removeItem = (): void =>
            setStQueue([...stRef.current.filter((item): boolean => item.id !== id)]);

          setTimeout(removeItem, REMOVE_TIMEOUT);

          return {
            ...item,
            id,
            isCompleted: false,
            removeItem
          };
        }))
      ]);
    },
    [setStQueue]
  );
  const queueExtrinsic = useCallback(
    (value: PartialQueueTxExtrinsic): void =>
      addToTxQueue({ ...value }),
    [addToTxQueue]
  );
  const queuePayload = useCallback(
    (payload: SignerPayloadJSON, signerCb: SignerCallback): void =>
      addToTxQueue({
        accountId: payload.address,
        // this is not great, but the Extrinsic we don't need a submittable
        extrinsic: createType(registry, 'Extrinsic',
          { method: createType(registry, 'Call', payload.method) },
          { version: payload.version }
        ) as unknown as SubmittableExtrinsic,
        payload,
        signerCb
      }),
    [addToTxQueue]
  );
  const queueRpc = useCallback(
    (value: PartialQueueTxRpc): void =>
      addToTxQueue({ ...value }),
    [addToTxQueue]
  );
  const queueSetTxStatus = useCallback(
    (id: number, status: QueueTxStatus, result?: SubmittableResult, error?: Error): void => {
      setTxQueue([...txRef.current.map((item): QueueTx =>
        item.id === id
          ? {
            ...item,
            error: error === undefined
              ? item.error
              : error,
            result: result === undefined
              ? item.result as SubmittableResult
              : result,
            status: item.status === 'completed'
              ? item.status
              : status
          }
          : item
      )]);

      queueAction(
        extractEvents(result)
      );

      if (STATUS_COMPLETE.includes(status)) {
        setTimeout((): void => {
          const item = txRef.current.find((item): boolean => item.id === id);

          item && item.removeItem();
        }, REMOVE_TIMEOUT);
      }
    },
    [queueAction, setTxQueue]
  );

  return (
    <QueueProvider value={{
      queueAction,
      queueExtrinsic,
      queuePayload,
      queueRpc,
      queueSetTxStatus,
      stqueue,
      txqueue
    }}>
      {children}
    </QueueProvider>
  );
}

export default React.memo(Queue);
