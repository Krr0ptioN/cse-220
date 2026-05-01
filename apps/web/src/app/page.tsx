import Link from 'next/link';
import {
  RiArrowRightLine,
  RiDiscountPercentLine,
  RiEBike2Line,
  RiMapPinLine,
  RiRestaurant2Line,
  RiShoppingBasket2Line,
  RiStarFill,
  RiTimeLine,
} from '@remixicon/react';
import { SearchBox } from '@flavor-map/ui-module-discovery';

const categories = [
  { label: 'Deals', icon: RiDiscountPercentLine, tone: 'bg-red-50 text-red-600' },
  { label: 'Grocery', icon: RiShoppingBasket2Line, tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Pizza', icon: RiRestaurant2Line, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Breakfast', icon: RiTimeLine, tone: 'bg-orange-50 text-orange-600' },
  { label: 'Delivery', icon: RiEBike2Line, tone: 'bg-sky-50 text-sky-600' },
];

const filters = ['Pickup', 'Delivery fee', 'Under 30 min', 'Open now', 'Top rated'];

const friendsEating = [
  {
    name: 'Creamy Shrimp Soup',
    note: 'Sarah just ordered this',
    meta: '$3.69 delivery fee · Ordered 2h ago',
    rating: '4.6',
    image:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Chicken Shawarma Wrap',
    note: 'Alfikri just ordered this',
    meta: '$8.52 delivery fee · 30 min',
    rating: '4.4',
    image:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Campus Fries Bowl',
    note: 'Mina saved this place',
    meta: '$1.99 delivery fee · 18 min',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80',
  },
];

const popularRestaurants = [
  {
    name: 'Kozy Burger Lab',
    category: 'Burgers · Comfort food',
    distance: '0.8 km away',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Noodle Street',
    category: 'Asian · Noodles',
    distance: '1.4 km away',
    image:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80',
  },
];

export default function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,oklch(0.97_0.03_86),transparent_34rem),linear-gradient(180deg,oklch(1_0_0),oklch(0.98_0.01_89))]">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-16 pt-8 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:items-start lg:gap-10 lg:pt-16">
        <div className="space-y-8">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <RiMapPinLine className="size-4" />
              Deliver to <span className="font-semibold text-foreground">1226 University Dr</span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                Find the food your friends are already craving.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Search dishes, restaurants, grocery runs, and campus favorites from one box. Built wide for desktop, still familiar on mobile.
              </p>
            </div>
            <SearchBox
              defaultExpanded
              placeholder="What are you craving?"
              searchPath="/restaurants"
              className="max-w-3xl"
              expandedClassName="h-14 border-black/10 bg-white/95 text-base shadow-2xl shadow-black/10"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.label}
                  href={`/restaurants?q=${encodeURIComponent(category.label)}`}
                  className="group rounded-3xl border border-black/5 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  <span className={`mb-3 flex size-12 items-center justify-center rounded-2xl ${category.tone}`}>
                    <Icon className="size-6" />
                  </span>
                  <span className="font-medium text-foreground">{category.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="whitespace-nowrap rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-white"
              >
                {filter}
              </button>
            ))}
          </div>

          <DiscoverySection title="Friends are eating" href="/restaurants">
            <div className="grid gap-4 md:grid-cols-3">
              {friendsEating.map((item) => (
                <FoodCard key={item.name} {...item} />
              ))}
            </div>
          </DiscoverySection>

          <DiscoverySection title="Popular near you" href="/restaurants">
            <div className="grid gap-4 md:grid-cols-2">
              {popularRestaurants.map((restaurant) => (
                <RestaurantPreview key={restaurant.name} {...restaurant} />
              ))}
            </div>
          </DiscoverySection>
        </div>

        <aside className="rounded-[2rem] border border-black/10 bg-foreground p-5 text-background shadow-2xl shadow-black/20 lg:sticky lg:top-8">
          <div className="space-y-5">
            <div className="rounded-[1.5rem] bg-white/10 p-4">
              <p className="text-sm text-background/70">Tonight's fastest route</p>
              <h2 className="mt-2 text-2xl font-semibold">Dinner in 24 minutes</h2>
              <p className="mt-2 text-sm leading-6 text-background/70">
                Compare pickup, delivery fee, and friend activity before you choose.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Open spots" value="142" />
              <Metric label="Avg rating" value="4.7" />
              <Metric label="Deals live" value="31" />
              <Metric label="Under 30 min" value="68" />
            </div>
            <Link
              href="/restaurants"
              className="flex items-center justify-between rounded-full bg-background px-4 py-3 font-semibold text-foreground transition hover:bg-background/90"
            >
              Explore restaurants
              <RiArrowRightLine className="size-5" />
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DiscoverySection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <Link
          href={href}
          aria-label={`View all ${title.toLowerCase()}`}
          className="flex size-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition hover:translate-x-0.5 hover:shadow-md"
        >
          <RiArrowRightLine className="size-5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function FoodCard({
  name,
  note,
  meta,
  rating,
  image,
}: {
  name: string;
  note: string;
  meta: string;
  rating: string;
  image: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden">
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
          {note}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{meta}</p>
        <p className="flex items-center gap-1 text-sm text-foreground">
          <RiStarFill className="size-4 text-amber-500" />
          {rating} · 25 min
        </p>
      </div>
    </article>
  );
}

function RestaurantPreview({
  name,
  category,
  distance,
  image,
}: {
  name: string;
  category: string;
  distance: string;
  image: string;
}) {
  return (
    <article className="grid grid-cols-[8rem_minmax(0,1fr)] overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:shadow-xl">
      <img src={image} alt="" className="h-full min-h-32 w-full object-cover" loading="lazy" />
      <div className="space-y-2 p-4">
        <h3 className="font-semibold tracking-tight text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{category}</p>
        <p className="text-sm font-medium text-foreground">{distance}</p>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-background/60">{label}</p>
    </div>
  );
}
