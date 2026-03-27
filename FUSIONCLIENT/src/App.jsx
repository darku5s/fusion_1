import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import GlobalRoutes from './routes/globalRoutes';

function App() {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'light',
        primaryColor: 'blue',
      }}
    >
      <BrowserRouter>
        <GlobalRoutes />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
