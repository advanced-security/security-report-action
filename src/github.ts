import { Octokit } from '@octokit/rest';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

//TODO introduce a logger?
import * as core from '@actions/core';
import { Logger } from './logging/Logger';

export type Repo = {
  owner: string,
  repo: string
}

export function getOctokit(token: string, baseUrl: string, logger: Logger): Octokit {
  const octokitOptions = {
    baseUrl: baseUrl,
    auth: token,
    log: console,
  };

  const proxyBackedFetch = getProxyAgent(logger, baseUrl);
  if (proxyBackedFetch) {
    const request = {
      fetch: proxyBackedFetch
    };

    octokitOptions['request'] = request;
  }

  return new Octokit(octokitOptions);
}

export function getApiBaseUrl(url?: string) {
  return url || process.env['GITHUB_API_URL'] || 'https://api.github.com'
}

function getProxyAgent(logger: Logger, baseUrl: string, proxy?: string) {
  if (proxy) {
    // User has an explict proxy set, use it
    logger.info(`explicit proxy specified as '${proxy}'`);
    return createProxyFetch(proxy);
  } else {
    // When loading from the environment, also respect no_proxy settings
    const envProxy = process.env.http_proxy
      || process.env.HTTP_PROXY
      || process.env.https_proxy
      || process.env.HTTPS_PROXY
      ;

    if (envProxy) {
      logger.info(`environment proxy specified as '${envProxy}'`);

      const noProxy = process.env.no_proxy || process.env.NO_PROXY;
      if (noProxy) {
        logger.info(`environment no_proxy set as '${noProxy}'`);
        if (proxyExcluded(noProxy, baseUrl)) {
          logger.info(`environment proxy excluded from no_proxy settings`);
        } else {
          logger.info(`using proxy '${envProxy}' for GitHub API calls`)
          return createProxyFetch(envProxy);
        }
      }
    }
  }
  return null;
}

function createProxyFetch(proxyUrl: string) {
  const myFetch: typeof undiciFetch = (url, opts) => {
    return undiciFetch(url, {
      ...opts,
      dispatcher: new ProxyAgent({
        uri: proxyUrl,
        //TODO maybe make these configurable over the defaults?
        // keepAliveTimeout: 10,
        // keepAliveMaxTimeout: 10,
      }),
    });
  };

  return myFetch;
}

function proxyExcluded(noProxy: string, baseUrl: string) {
  if (noProxy) {
    const noProxyHosts = noProxy.split(',').map(part => part.trim());
    const baseUrlHost = new URL(baseUrl).host;

    core.debug(`noProxyHosts = ${JSON.stringify(noProxyHosts)}`);
    core.debug(`baseUrlHost = ${baseUrlHost}`);

    return noProxyHosts.indexOf(baseUrlHost) > -1;
  }
}

