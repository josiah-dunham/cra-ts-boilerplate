import wretch from 'wretch'

const bearerString = 'Bearer 6828e803c9970e3a44d0e4fe549187876efba369f474d897112fd1945a97d552'

const req = wretch()
  .polyfills({
    fetch: require('node-fetch'),
    FormData: require('form-data'),
    URLSearchParams: require('url').URLSearchParams,
  })
  .url('https://dev-connect-projectwisedocumentservice.bentley.com/saml-token')
  .auth(bearerString)

export const getSAMLToken = () => {
  return req
    .get()
    .json()
    .then(r => r.saml)
    .catch(e => console.log('\nERROR FETCHING TOKEN \n', e))
}
