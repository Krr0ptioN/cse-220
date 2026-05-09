export type HomepageDiscoverySections<Restaurant> = {
  top_rated: Restaurant[];
  newest: Restaurant[];
};

export type DiscoveryRequest<Response> = (
  url: string,
  options?: RequestInit,
) => Promise<Response>;

export async function getHomepageDiscovery<Restaurant>(
  request: DiscoveryRequest<Partial<HomepageDiscoverySections<Restaurant>>>,
  homepageUrl: string,
): Promise<HomepageDiscoverySections<Restaurant>> {
  const response = await request(homepageUrl);

  return normalizeHomepageDiscovery(response);
}

export function normalizeHomepageDiscovery<Restaurant>(
  response: Partial<HomepageDiscoverySections<Restaurant>> | null | undefined,
): HomepageDiscoverySections<Restaurant> {
  return {
    top_rated: Array.isArray(response?.top_rated) ? response.top_rated : [],
    newest: Array.isArray(response?.newest) ? response.newest : [],
  };
}
