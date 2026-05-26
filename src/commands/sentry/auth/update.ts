import {createAuthUpdateCommand, type FieldDef} from '@hesed/plugin-lib'

import {type Config} from '../../../sentry/sentry-api.js'
import {clearClients, getClient} from '../../../sentry/sentry-client.js'

const fields: FieldDef[] = [
  {char: 't', description: 'Auth token', masked: true, message: 'Auth token:', name: 'authToken'},
  {char: 'o', description: 'Organization slug', message: 'Organization slug:', name: 'organization'},
  {char: 'u', default: 'https://sentry.io/api/0', description: 'Sentry base URL', message: 'Sentry base URL:', name: 'host'},
]

export default createAuthUpdateCommand({
  clearClients,
  fields,
  hasHostFlag: false,
  serviceName: 'Sentry',
  testConnection: async (auth: Config) => {
    try {
      const client = getClient(auth)
      return client.testConnection()
    } catch (error) {
      return {error, success: false}
    }
  },
})
