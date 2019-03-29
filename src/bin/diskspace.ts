#!/usr/bin/env node

import * as program from 'commander';
import * as prettyBytes from 'pretty-bytes';
import { defaultTo } from 'ramda';
import { dirSize } from '../lib/dir-size';
import * as spinner from '../lib/progress';
import { ProgressCallback, ProgressType } from '../types';
import chalk from 'chalk';

const MAX_LOG_DEPTH = 10;

const cmd = program
    .version('1.0.0')
    .description('calculates diskspace per folder')
    .option('-s, --sort', 'Sorts by size')
    .parse(process.argv);

const args = cmd.args;
const sort: boolean = defaultTo(false, cmd.sort);

if (args.length === 0) {
    console.log('ERROR: missing directory');
    process.exit(1);
}

spinner.start('Reading folders...');

let total = 0;

const callback: ProgressCallback = (type: ProgressType, name: string, depth: number, size: number) => {
    if (depth > MAX_LOG_DEPTH) {
        return;
    }
    total += size;
    switch (type) {
        case ProgressType.Enter:
            spinner.setText(`${prettyBytes(total)}: ${name}`);
        case ProgressType.Exit:
            spinner.setText(`${prettyBytes(total)}: ${name}`);
            break;
    }
};

const dir = args[0];

dirSize(dir, callback)
    .then(output => {
        spinner.stop();

        console.log(`${chalk.bold(dir)}: ${chalk.cyan(prettyBytes(output.size))}`);
        console.log(`- files:   ${chalk.cyan(prettyBytes(output.sizeOwnFiles))}`);
        console.log(`- subdirs: ${chalk.cyan(prettyBytes(output.size - output.sizeOwnFiles))}`);
        if (output.subdirs.length > 0) {
            console.log(chalk.grey('Subdirectories:'));
            output.subdirs.forEach(subDir => {
                console.log(`${chalk.bold(subDir.name)}: ${chalk.cyan(prettyBytes(subDir.size))}`);
            });
        }
    })
    .catch(err => {
        spinner.stop();
        console.error(err.stack);
        process.exit(1);
    });
