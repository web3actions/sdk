import { Octokit } from 'octokit'

const processRequest = async (requestId, signatureId, oracleRepo, auth) => {
  // post issue in oracle repo
  const octokit = new Octokit({ auth })
  const issue = await octokit.rest.issues.create({
    owner: oracleRepo.split('/')[0],
    repo: oracleRepo.split('/')[1],
    title: 'Oracle Request',
    body: JSON.stringify({ requestId, signatureId })
  })
  
  // check periodically for confirmations/signatures
  return {
    getStatus: async () => {
      const comments = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: oracleRepo.split('/')[0],
        repo: oracleRepo.split('/')[1],
        issue_number: issue.number,
        per_page: 100
      })

      const statusComment = comments.find(comment => comment.body.startsWith('Processing...'))
      if (statusComment) {
        return statusComment.body
      }

      return null
    }
  }
}

export { processRequest }