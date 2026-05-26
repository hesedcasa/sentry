import {createAuthProfileCommand} from '@hesed/plugin-lib'

export default createAuthProfileCommand({clearClients: () => {}, hasHostFlag: false, serviceName: 'Sentry', testConnection: async () => ({success: true})})
