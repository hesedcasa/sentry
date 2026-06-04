import {createAuthUpdateCommand, type FieldDef} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../sentry/sentry-client.js'

const fields: FieldDef[] = [
  {char: 't', description: 'Auth token', name: 'authToken', type: 'string'},
  {char: 'o', description: 'Organization slug', name: 'organization', type: 'string'},
  {char: 'u', default: 'https://sentry.io/api/0', description: 'Sentry base URL', name: 'host', type: 'string'},
]

export default createAuthUpdateCommand({
  clearClients,
  configFile: 'sentry-config.json',
  fields,
  serviceName: 'Sentry',
  testConnection,
})
