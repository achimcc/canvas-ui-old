// Copyright 2017-2021 @canvas-ui/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api'
import { ContractPromise as Contract } from '@polkadot/api-contract'

import getContractAbi from './getContractAbi'
import { StringOrNull } from './types'

export default function getContractForAddress(api: ApiPromise, address: StringOrNull): Contract | null {
  if (!address) {
    return null
  } else {
    const abi = getContractAbi(address)

    return abi ? new Contract(api, abi, address) : null
  }
}
