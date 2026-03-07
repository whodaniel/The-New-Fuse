import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';

const unsupportedNodeAdapter: AxiosAdapter = async (
  _config: AxiosRequestConfig
): Promise<AxiosResponse> => {
  throw new Error('Axios Node HTTP adapter is not supported in browser bundles.');
};

export default unsupportedNodeAdapter;
