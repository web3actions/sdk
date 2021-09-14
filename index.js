const axios = require('axios')
const { decode } = require('js-base64')

const githubApiUrl = 'https://api.github.com'

const getConfig = async function (owner, githubToken = null, configName = 'cryptoactions') {
  let repo = owner
  if (/[\w-]+\/[\w-]+/.test(owner)) {
    [ owner, repo ] = owner.split('/')
  }
  
  const auth = {}
  if (githubToken) {
    auth.headers = {
      Authorization: 'token ' + githubToken
    }
  }
  
  // fetch file list from repo
  const repoContent = await axios.get(`${githubApiUrl}/repos/${owner}/${repo}/contents`, auth).then(response => response.data)
  
  // check if a {configName}.json file exists
  const cryptoJsonFile = repoContent.find(file => file.type === 'file' && file.name === configName + '.json')
  if (cryptoJsonFile) {
    const cryptoJson = await axios.get(`${githubApiUrl}/repos/${owner}/${repo}/contents/${configName}.json`, auth).then(response => response.data)
    return JSON.parse(decode(cryptoJson.content))
  }

  // otherwise look for "{configName}" section in package.json
  const packageJsonFile = repoContent.find(file => file.type === 'file' && file.name === 'package.json')
  if (packageJsonFile) {
    const packageJsonContent = await axios.get(`${githubApiUrl}/repos/${owner}/${repo}/contents/package.json`, auth).then(response => response.data)
    const packageJson = JSON.parse(decode(packageJsonContent.content))
    if (Object.prototype.hasOwnProperty.call(packageJson, configName)) {
      return packageJson[configName]
    }
  }

  return null
}

const processRequest = async (requestId, destination, githubToken = null) => {
  if (destination.startsWith('https://')) {
    // post request to api endpoint
    return await axios.post(destination, { requestId })
  } else if (/[\w-]+\/[\w-]+/.test(destination)) {
    // post request as issue in oracle repo
    const [ owner, repo ] = destination.split('/')
    return await axios.post(
      `${githubApiUrl}/repos/${owner}/${repo}/issues`,
      {
        title: 'Oracle Request',
        body: JSON.stringify({ requestId })
      },
      {
        headers: {
          Authorization: 'token ' + githubToken
        }
      }
    ).then(response => response.data)
  } else {
    throw new Error('Invalid destination: ' + destination)
  }
}

const countContributionsRange = async (username, githubToken, from, to) => {
  return await axios.post(
    'https://api.github.com/graphql',
    {
      query: `query($username:String!, $from:DateTime!, $to:DateTime!) {
        user(login: $username) {
          contributionsCollection (from: $from, to: $to) {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }`,
      variables: { username, from, to }
    },
    {
      headers: {
        Authorization: 'token ' + githubToken
      }
    }
  ).then(res => res.data.data.user.contributionsCollection.contributionCalendar.totalContributions)
}

const countContributions = async (username, githubToken, fromYear = 2007, toYear = new Date().getFullYear()) => {
  let count = 0
  for (let year = fromYear; year <= toYear; year++) {
    count += await countContributionsRange(
      username,
      githubToken,
      `${year}-01-01T00:00:00.000+00:00`,
      `${year + 1}-01-01T00:00:00.000+00:00`
    )
  }
  return count
}

const getFirstDeepestValue = (object) => {
  if (typeof object === 'string' || typeof object === 'number' || typeof object === 'boolean') {
    return object
  }

  const keys = Object.keys(object)
  if (keys.length && !Array.isArray(object)) {
    return getFirstDeepestValue(object[keys[0]])
  }

  return null
}

module.exports = { getConfig, processRequest, countContributions, getFirstDeepestValue }