import { AppShell } from '@mantine/core';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }) {
  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 80, // Default width for sidebar mini
        breakpoint: 'sm',
      }}
      padding="md"
      styles={{
        main: {
          backgroundColor: 'var(--erp-bg)',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Navbar p={0}>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

export default MainLayout;
