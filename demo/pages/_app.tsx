import {NextAdapter} from 'next-query-params'
import type {AppProps} from 'next/app'
import Head from 'next/head'
import {QueryParamProvider} from 'use-query-params'
import '../__generated__/tailwind.css'

export default function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
      <Head>
        <title>react-visual-novel demo</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <QueryParamProvider adapter={NextAdapter}>
        <Component {...pageProps} />
      </QueryParamProvider>
    </>
  )
}
