import { Api, HttpClient } from 'tonapi-sdk-js';

const API_KEY =
  'AFIM5HFWDV5IPCIAAAAJW7LUZ6FXXRIAT63WRYZ2IDEKTBDQBVXXTYP2DONDRDZUYZ5MEMQ';

const httpClient = new HttpClient({
  baseUrl: 'https://testnet.tonapi.io',
  baseApiParams: {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-type': 'application/json',
    },
  },
});

const client = new Api(httpClient);

export default client;
