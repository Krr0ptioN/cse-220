import { ExploreView } from './_components/explore-view';

type RestaurantsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RestaurantsPage({
  searchParams,
}: RestaurantsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQuery = getFirstParam(resolvedSearchParams?.q)?.trim() ?? '';
  const initialPage = getSafePageValue(
    getFirstParam(resolvedSearchParams?.page),
  );

  return <ExploreView initialQuery={initialQuery} initialPage={initialPage} />;
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getSafePageValue(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}
