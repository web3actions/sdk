const axios = require('axios')
const { decode } = require('js-base64')

const githubApiUrl = 'https://api.github.com'

const getConfig = async function (owner, githubToken = null) {
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
  
  // check if a .crypto.json file exists
  const cryptoJsonFile = repoContent.find(file => file.type === 'file' && file.name === 'crypto.json')
  if (cryptoJsonFile) {
    const cryptoJson = await axios.get(`${githubApiUrl}/repos/${owner}/${repo}/contents/crypto.json`, auth).then(response => response.data)
    return JSON.parse(decode(cryptoJson.content))
  }

  // otherwise look for "crypto" section in package.json
  const packageJsonFile = repoContent.find(file => file.type === 'file' && file.name === 'package.json')
  if (packageJsonFile) {
    const packageJsonContent = await axios.get(`${githubApiUrl}/repos/${owner}/${repo}/contents/package.json`, auth).then(response => response.data)
    const packageJson = JSON.parse(decode(packageJsonContent.content))
    if (Object.prototype.hasOwnProperty.call(packageJson, 'crypto')) {
      return packageJson.crypto
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

const countContributions = async (username, githubToken) => {
  return await axios.post(
    'https://api.github.com/graphql',
    {
      query: `query($username:String!) {
        user(login: $username) {
          contributionsCollection (to: "2021-10-01T00:00:00.000+00:00") {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }`,
      variables: { username }
    },
    {
      headers: {
        Authorization: 'token ' + githubToken
      }
    }
  ).then(res => res.data.data.user.contributionsCollection.contributionCalendar.totalContributions)
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