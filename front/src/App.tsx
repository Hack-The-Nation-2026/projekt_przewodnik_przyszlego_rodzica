import { Route, Routes } from 'react-router-dom'
import { RootLayout } from '@/components/layout/root-layout'
import { DokumentyPage } from '@/pages/dokumenty-page'
import { HomePage } from '@/pages/home-page'
import { KalkulatorPage } from '@/pages/kalkulator-page'
import { MobywatelPage } from '@/pages/mobywatel-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PanelPage } from '@/pages/panel-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { SprawyPage } from '@/pages/sprawy-page'
import { WejsciePage } from '@/pages/wejscie-page'
import { WsparciePage } from '@/pages/wsparcie-page'
import { ZusPage } from '@/pages/zus-page'

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
        <Route path="dokumenty" element={<DokumentyPage />} />
        <Route path="sprawy" element={<SprawyPage />} />
        <Route path="zus" element={<ZusPage />} />
        <Route path="panel" element={<PanelPage />} />
        <Route path="wsparcie/:topic?" element={<WsparciePage />} />
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
