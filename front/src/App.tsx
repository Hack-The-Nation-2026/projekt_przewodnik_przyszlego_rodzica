import { Route, Routes } from 'react-router-dom'
import { RootLayout } from '@/components/layout/root-layout'
import { HomePage } from '@/pages/home-page'
import { KalkulatorPage } from '@/pages/kalkulator-page'
import { MobywatelPage } from '@/pages/mobywatel-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { WejsciePage } from '@/pages/wejscie-page'

export default function App() {
  return (
    <Routes>
      {/* Logowanie mObywatela ma własny, pełnoekranowy układ, bez naszego nagłówka. */}
      <Route path="mobywatel" element={<MobywatelPage />} />

      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="wejscie" element={<WejsciePage />} />
        <Route
          path="swiadczenia"
          element={
            <PlaceholderPage
              title="Świadczenia"
              description="Katalog świadczeń z filtrami dla sytuacji: ciąża, poród, adopcja, rodzina zastępcza."
            />
          }
        />
        <Route path="kalkulator" element={<KalkulatorPage />} />
        <Route
          path="dokumenty"
          element={
            <PlaceholderPage
              title="Dokumenty i wnioski"
              description="Lista dokumentów, terminy i informacja, gdzie je złożyć: u pracodawcy albo w ZUS."
            />
          }
        />
        <Route
          path="wsparcie"
          element={
            <PlaceholderPage
              title="Wsparcie w trudnych sytuacjach"
              description="Miejsca i organizacje, które pomagają po stracie dziecka, przy wcześniaku i w ciężkiej chorobie."
            />
          }
        />
        <Route
          path="o-projekcie"
          element={
            <PlaceholderPage
              title="O projekcie"
              description="Cel narzędzia, użyte technologie i informacja, które funkcje działają ze wsparciem AI."
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
