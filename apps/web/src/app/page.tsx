import { 
  Header, 
} from './_components';
import { SearchBox } from '@flavor-map/ui-module-discovery';


export default function Index() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10 justify-center items-center">
      <Header />

          <SearchBox />
    </main>
  );
}
