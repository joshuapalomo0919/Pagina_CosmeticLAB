import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { cargarSemillas } from './data/semilla'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('No se encontró el contenedor principal de CosmeticLAB.')
}

const root = createRoot(rootElement)
void cargarSemillas()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    console.error('No se pudieron cargar los datos de CosmeticLAB.', error)
    root.render(
      <main role="alert">
        No fue posible iniciar CosmeticLAB. Revisa el almacenamiento local e inténtalo de nuevo.
      </main>,
    )
  })
