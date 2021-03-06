import fs from 'fs-extra';
import path from 'path';
import { propEq } from 'ramda';

import { getEntryType } from '../lib/get-entry-type';
import { DirEntries } from '../types';

export async function getDirEntries(dir: string): Promise<DirEntries> {
    try {
        const dirEntries = await fs.readdir(dir);
        const entriesWithType = await Promise.all(
            dirEntries.map(async entry => {
                const fullPath = path.join(dir, entry);
                const entryInfo = await getEntryType(fullPath);
                return {
                    name: fullPath,
                    type: entryInfo.type,
                    size: entryInfo.size
                };
            })
        );
        const files = entriesWithType.filter(propEq('type', 'file'));
        const dirs = entriesWithType.filter(propEq('type', 'dir'));
        return {
            files,
            dirs
        };
    } catch (e) {
        return {
            dirs: [],
            files: []
        };
    }
}
