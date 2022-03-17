import { randomDiceWebsiteUrl } from 'config/url';
import {
    ApplicationCommandData,
    ClientUser,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
} from 'discord.js';
import cooldown from 'util/cooldown';
import { reply } from 'util/typesafeReply';
import getBrandingEmbed from './util/getBrandingEmbed';

export default async function sendLinks(
    input: Message | CommandInteraction
): Promise<void> {
    const { client } = input;
    const command =
        input instanceof Message
            ? input.content.split(' ')[1]
            : input.commandName;

    if (
        await cooldown(input, '.gg link', {
            default: 10 * 1000,
            donator: 2 * 1000,
        })
    ) {
        return;
    }
    switch (command) {
        case 'website': {
            const path =
                input instanceof Message
                    ? input.content.split(' ').slice(0, 2).join(' ')
                    : input.options.getString('path');
            if (path?.startsWith('/')) {
                await reply(input, randomDiceWebsiteUrl(encodeURI(path)));
            } else {
                await reply(input, randomDiceWebsiteUrl());
            }
            break;
        }
        case 'app':
            await reply(
                input,
                'https://play.google.com/store/apps/details?id=gg.randomdice.twa'
            );
            break;
        case 'invite':
            await reply(
                input,
                `You can click this link to invite ${(
                    input.client.user as ClientUser
                ).toString()} to your own server.\nhttps://discord.com/oauth2/authorize?client_id=${
                    client.user?.id
                }&permissions=355393&scope=bot`
            );
            break;
        case 'support':
            await reply(input, {
                embeds: [
                    getBrandingEmbed()
                        .setTitle('Support Us')
                        .setDescription(
                            'You can support randomdice.gg by funding in patreon or contributing on github.'
                        ),
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setStyle('LINK')
                            .setLabel('Patreon')
                            .setURL(
                                'https://www.patreon.com/RandomDiceCommunityWebsite'
                            ),
                        new MessageButton()
                            .setStyle('LINK')
                            .setLabel('GitHub')
                            .setURL('https://github.randomdice.gg'),
                    ]),
                ],
            });
            break;
        default:
    }
}

export const commandData: ApplicationCommandData[] = [
    {
        name: 'website',
        description: 'Sends the website link',
        options: [
            {
                name: 'path',
                description: 'The path to the page starting with a /',
                type: 3,
            },
        ],
    },
    {
        name: 'app',
        description: 'Sends the app link',
    },
    {
        name: 'invite',
        description: 'Sends the invite link to the community discord',
    },
    {
        name: 'support',
        description: 'Sends the patreon link to fund this bot and support us',
    },
];
