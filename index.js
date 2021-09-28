const axios = require('axios')
const { decode } = require('js-base64')

const githubApiUrl = 'https://api.github.com'

const getConfig = async function (owner, githubToken = null, configName = 'web3') {
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

module.exports = { getConfig }