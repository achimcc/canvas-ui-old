// Copyright 2017-2021 @canvas-ui/react-params authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { registry } from '@canvas-ui/react-api';
import React from 'react';

import { Bytes } from '@polkadot/types';

import { Props } from '../types';
import CallDisplay from './Call';
import Unknown from './Unknown';

function OpaqueCall (props : Props) : React.ReactElement<Props> {
  if (!props.isDisabled) {
    return <Unknown {...props} />;
  }

  const value = registry.createType('Call', (props.defaultValue.value as Bytes).toHex());

  return <CallDisplay {...props} defaultValue={{ isValid: true, value }} />;
}

export default React.memo(OpaqueCall);
