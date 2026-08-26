import fs from 'node:fs';
import path from 'node:path';
import { Fetcher } from './fetcher';
import { Utilities } from './utils';
import { ParsedQs } from './interfaces/interface';
import { availableThemes } from './styles/themes';

const username = process.env.GRAPH_USERNAME || process.env.GITHUB_REPOSITORY_OWNER;
const outputDirectory = process.env.GRAPH_OUTPUT_DIR || process.cwd();

if (!username) {
    throw new Error('GRAPH_USERNAME or GITHUB_REPOSITORY_OWNER must be set');
}

const query: ParsedQs = {
    username,
    days: process.env.GRAPH_DAYS || '31',
    area: process.env.GRAPH_AREA === 'true',
};

const generate = async (): Promise<void> => {
    const defaultUtilities = new Utilities({ ...query, theme: 'default' });
    const options = defaultUtilities.queryOptions();
    const fetcher = new Fetcher(username);
    const contributions = await fetcher.fetchContributions(options.days, options.from, options.to);

    if (typeof contributions === 'string') {
        throw new Error(contributions);
    }

    fs.mkdirSync(outputDirectory, { recursive: true });

    for (const theme of availableThemes) {
        for (const hideBorder of [false, true]) {
            const utilities = new Utilities({ ...query, theme, hide_border: hideBorder });
            const graph = await utilities.buildGraph(contributions);
            const suffix = hideBorder ? '-no-border' : '';
            const filename = theme === 'default' && !hideBorder
                ? 'graph.svg'
                : `graph-${theme}${suffix}.svg`;
            fs.writeFileSync(path.join(outputDirectory, filename), graph.finalGraph, 'utf8');
        }
    }
};

generate().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
