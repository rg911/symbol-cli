/*
 *
 * Copyright 2018-present NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import {AccountRestrictionTransaction, Deadline} from 'symbol-sdk'
import {command, metadata, option} from 'clime'

import {ActionResolver} from '../../resolvers/action.resolver'
import {ActionType} from '../../models/action.enum'
import {AddressAliasResolver} from '../../resolvers/address.resolver'
import {AnnounceTransactionsCommand} from '../../interfaces/announce.transactions.command'
import {AnnounceTransactionsOptions} from '../../interfaces/announceTransactions.options'
import {MaxFeeResolver} from '../../resolvers/maxFee.resolver'
import {PasswordResolver} from '../../resolvers/password.resolver'
import {RestrictionAccountAddressFlagsResolver} from '../../resolvers/restrictionAccount.resolver'
import {TransactionSignatureOptions} from '../../services/transaction.signature.service'

export class CommandOptions extends AnnounceTransactionsOptions {
    @option({
        flag: 'f',
        description: 'Restriction flags.(' +
            'AllowOutgoingAddress, ' +
            'BlockOutgoingAddress, ' +
            'AllowIncomingAddress, ' +
            'BlockIncomingAddress)',
    })
    flags: string

    @option({
        flag: 'a',
        description: 'Modification action. (' +
            'Add, ' +
            'Remove).',
    })
    action: string

    @option({
        flag: 'v',
        description: 'Address or @alias to allow/block.',
    })
    recipientAddress: string
}

@command({
    description: 'Allow or block incoming and outgoing transactions for a given a set of addresses',
})
export default class extends AnnounceTransactionsCommand {
    constructor() { super() }

    @metadata
    async execute(options: CommandOptions) {
        const profile = this.getProfile(options)
        const password = await new PasswordResolver().resolve(options)
        const account = profile.decrypt(password)
        const action = await new ActionResolver().resolve(options)
        const flags = await new RestrictionAccountAddressFlagsResolver().resolve(options)
        const address = await new AddressAliasResolver()
        .resolve(options, undefined, 'Enter the recipient address (or @alias):', 'recipientAddress')
        const maxFee = await new MaxFeeResolver().resolve(options)
        const signerMultisigInfo = await this.getSignerMultisigInfo(options)

        const transaction = AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
            Deadline.create(),
            flags,
            (action === ActionType.Add) ? [address] : [],
            (action === ActionType.Remove) ? [address] : [],
            profile.networkType,
            maxFee,
        )

        const signatureOptions: TransactionSignatureOptions = {
            account,
            transactions: [transaction],
            maxFee,
            signerMultisigInfo,
        }

        const signedTransactions = await this.signTransactions(signatureOptions, options)
        this.announceTransactions(options, signedTransactions)
    }
}
