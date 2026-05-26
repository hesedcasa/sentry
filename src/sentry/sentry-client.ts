import {createApiClient} from '@hesed/plugin-lib'

import {type Config, SentryApi} from './sentry-api.js'

const {clearClients, getClient} = createApiClient<Config, SentryApi>('Sentry', (config: Config) => new SentryApi(config))

export {clearClients, getClient}
