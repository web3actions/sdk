import axios from 'axios'

const githubApiUrl = 'https://api.github.com'

const processRequest = async (requestId, destination, githubToken = null) => {
  if (destination.startsWith('https://')) {
    // post request to api endpoint
    return await axios.post(destination, { requestId })
  } else if (/[\w-]+\/[\w-]+/.test(destination)) {
    // post request as issue in oracle repo
    return await axios.post(
      `${githubApiUrl}/repos/${destination.split('/')[0]}/${destination.split('/')[1]}/issues`,
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

export { processRequest, getFirstDeepestValue }