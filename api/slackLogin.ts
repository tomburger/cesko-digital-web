import { VercelRequest, VercelResponse } from '@vercel/node'
import { ValidationError } from './resize'
import { URLSearchParams } from 'url'
import Airtable from 'airtable'
import fetch from 'node-fetch'

const slackClientId: string = process.env.SLACK_CLIENT_ID || ''
const slackClientSecret: string = process.env.SLACK_CLIENT_SECRET || ''
const slackRedirectUri: string = process.env.SLACK_REDIRECT_URI || ''
const sessionsApiKey: string = process.env.AIRTABLE_SESSIONS_API_KEY || ''
const airtableBaseId: string = process.env.AIRTABLE_TRANSLATION_BASE_ID || ''

interface AirtableCredentials {
  sessionsApiKey: string
  baseId: string
}

interface SlackCredentials {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface SlackTokenInfo {
  tokenType: string
  jwt: string
  accessToken: string
}

interface UserInfo {
  userId: string
  slackToken: SlackTokenInfo
}

function getSlackCredentials(): SlackCredentials {
  if (!slackClientId || !slackClientSecret || !slackRedirectUri) {
    throw new ValidationError(
      'One or more function environment variables are not set',
      400
    )
  }

  return {
    clientId: slackClientId,
    clientSecret: slackClientSecret,
    redirectUri: slackRedirectUri,
  }
}

function getAirtableCredentials(): AirtableCredentials {
  if (!sessionsApiKey || !airtableBaseId) {
    throw new ValidationError('Airtable credentials are not configured', 500)
  }

  return {
    sessionsApiKey,
    baseId: airtableBaseId,
  }
}

function getSlackCode(request: VercelRequest): string {
  const { code } = request.query

  if (typeof code !== 'string') {
    throw new ValidationError('Query parameter "code" is required', 400)
  }

  return code
}

async function writeAirtableSession(userData: UserInfo): Promise<void> {
  const credentials = getAirtableCredentials()

  const base = new Airtable({ apiKey: credentials.sessionsApiKey }).base(
    credentials.baseId
  )

  await base('Sessions').create([
    {
      fields: {
        'ID': userData.slackToken.jwt,
        'Slack Token': userData.slackToken.accessToken,
        'Slack User ID': userData.userId,
      },
    },
  ])
}

async function getSlackTokenInfo(code: string): Promise<SlackTokenInfo> {
  const params = new URLSearchParams()
  const slackCredentials = getSlackCredentials()

  params.append('client_id', slackCredentials.clientId)
  params.append('client_secret', slackCredentials.clientSecret)
  params.append('redirect_uri', slackCredentials.redirectUri)
  params.append('code', code)

  const response = await fetch('https://slack.com/api/openid.connect.token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const responseData = await response.json()

  if (responseData.ok !== true) {
    throw new ValidationError('Code verification failed', 500)
  }

  return {
    tokenType: responseData.token_type,
    accessToken: responseData.access_token,
    jwt: responseData.id_token,
  }
}

async function getSlackUserInfo(request: VercelRequest): Promise<UserInfo> {
  const tokenInfo = await getSlackTokenInfo(getSlackCode(request))

  const response = await fetch(
    'https://slack.com/api/openid.connect.userInfo',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': tokenInfo.tokenType + ' ' + tokenInfo.accessToken,
      },
    }
  )

  const responseData = await response.json()

  if (responseData.ok !== true) {
    throw new ValidationError('Fetching Slack User Info failed', 500)
  }

  return {
    userId: responseData['https://slack.com/user_id'],
    slackToken: tokenInfo,
  }
}

export default async (
  request: VercelRequest,
  response: VercelResponse
): Promise<void> => {
  try {
    const userInfo = await getSlackUserInfo(request)
    await writeAirtableSession(userInfo)

    response.setHeader('Content-Type', 'application/json')
    response.status(200).send({ result: 'success', slackInfo: userInfo })
  } catch (e) {
    const [code, msg] =
      e instanceof ValidationError
        ? [e.statusCode, e.message]
        : [500, 'Unexpected error, pull requests welcome :)']
    response.status(code).send(msg)
  }
}
