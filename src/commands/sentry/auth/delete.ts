import {createAuthDeleteCommand} from '@hesed/plugin-lib'

import {clearClients} from '../../../sentry/sentry-client.js'

export default createAuthDeleteCommand({clearClients, hasHostFlag: false, serviceName: 'Sentry', testConnection: async () => ({success: true})})
