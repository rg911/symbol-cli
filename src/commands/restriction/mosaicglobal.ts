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
import * as Table from 'cli-table3';
import { HorizontalTable } from 'cli-table3';
import { command, metadata, option } from 'clime';
import { MosaicGlobalRestrictionItem, MosaicRestrictionType } from 'symbol-sdk';

import { ProfileCommand } from '../../interfaces/profile.command';
import { ProfileOptions } from '../../interfaces/profile.options';
import { MosaicIdResolver } from '../../resolvers/mosaic.resolver';
import { FormatterService } from '../../services/formatter.service';

export class CommandOptions extends ProfileOptions {
    @option({
        flag: 'm',
        description: 'Mosaic id in hexadecimal format.',
    })
    mosaicId: string;
}

export class MosaicGlobalRestrictionsTable {
    private readonly table: HorizontalTable;

    constructor(public readonly mosaicGlobalRestrictions: Map<string, MosaicGlobalRestrictionItem>) {
        this.table = new Table({
            style: { head: ['cyan'] },
            head: ['Restriction Key', 'Reference MosaicId', 'Restriction Type', 'Restriction Value'],
        }) as HorizontalTable;

        mosaicGlobalRestrictions.forEach((value: MosaicGlobalRestrictionItem, key: string) => {
            this.table.push([key, value.referenceMosaicId.toHex(), MosaicRestrictionType[value.restrictionType], value.restrictionValue]);
        });
    }

    toString(): string {
        let text = '';
        text += FormatterService.title('Mosaic Global Restrictions');
        text += '\n' + this.table.toString();
        return text;
    }
}

@command({
    description: 'Fetch global restrictions assigned to a mosaic',
})
export default class extends ProfileCommand {
    constructor() {
        super();
    }

    @metadata
    async execute(options: CommandOptions) {
        const profile = this.getProfile(options);
        const mosaicId = await new MosaicIdResolver().resolve(options);

        this.spinner.start();
        const restrictionHttp = profile.repositoryFactory.createRestrictionMosaicRepository();
        restrictionHttp.getMosaicGlobalRestriction(mosaicId).subscribe(
            (mosaicRestrictions) => {
                this.spinner.stop();
                if (mosaicRestrictions.restrictions.size > 0) {
                    console.log(new MosaicGlobalRestrictionsTable(mosaicRestrictions.restrictions).toString());
                } else {
                    console.log(FormatterService.error('The mosaicId does not have mosaic global restrictions assigned'));
                }
            },
            (err) => {
                this.spinner.stop();
                console.log(FormatterService.error(err));
            },
        );
    }
}
