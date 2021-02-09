// Copyright 2017-2021 @canvas-ui/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// anything for a specific chain, most would probably fit into the node category (but allow for chain-specific)
import chainKusama from './chains/kusama-128.gif'
// extensions
import extensionPolkadotJs from './extensions/polkadot-js.svg'
// defaults for the node type, assuming we don't have a specific chain, but rather match on the implementation
import nodeCentrifuge from './nodes/centrifuge.png'
import nodeEdgeware from './nodes/edgeware-circle.svg'
import nodeEncointer from './nodes/encointer.svg'
import nodeNodle from './nodes/nodle.svg'
import nodePolkadot from './nodes/polkadot-circle.svg'
import nodePolkadotJs from './nodes/polkadot-js.svg'
import nodeSubstrate from './nodes/substrate-hexagon.svg'
// last-resort fallback, just something empty
import emptyLogo from './empty.svg'

// overrides based on the actual matched chain name
const chainLogos: Record<string, any> = [
    ['Kusama', chainKusama], // new name after CC3
    ['Kusama CC1', chainKusama],
    ['Kusama CC2', chainKusama],
    ['Kusama CC3', chainKusama],
].reduce(
    (logos, [chain, logo]): Record<string, any> => ({
        ...logos,
        [(chain as string).toLowerCase()]: logo,
    }),
    {}
)

// overrides based on the actual software node type (all '-' converted to ' ')
const nodeLogos: Record<string, any> = [
    ['centrifuge chain', nodeCentrifuge],
    ['Centrifuge Chain Node', nodeCentrifuge],
    ['Edgeware Node', nodeEdgeware],
    ['Encointer Node', nodeEncointer],
    ['kulupu', nodeSubstrate],
    ['node-template', nodeSubstrate],
    ['Nodle Chain Node', nodeNodle],
    ['parity-polkadot', nodePolkadot],
    ['polkadot-js', nodePolkadotJs],
    ['substrate-node', nodeSubstrate],
].reduce(
    (logos, [node, logo]): Record<string, any> => ({
        ...logos,
        [(node as string).toLowerCase().replace(/-/g, ' ')]: logo,
    }),
    {}
)

// overrides when we pass an explicit logo name
const namedLogos: Record<string, any> = {
    alexander: nodePolkadot,
    centrifuge: nodeCentrifuge,
    edgeware: nodeEdgeware,
    empty: emptyLogo,
    kusama: chainKusama,
    nodle: nodeNodle,
    polkadot: nodePolkadot,
    substrate: nodeSubstrate,
    westend: nodePolkadot,
}

// extension logos
const extensionLogos: Record<string, any> = {
    'polkadot-js': extensionPolkadotJs,
}

export { chainLogos, emptyLogo, extensionLogos, namedLogos, nodeLogos }
