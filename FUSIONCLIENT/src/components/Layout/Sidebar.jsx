import { useState } from 'react';
import { Stack, Tooltip, UnstyledButton, rem, Box, Text } from '@mantine/core';
import {
  IconHome2,
  IconSchool,
  IconBook,
  IconFileText,
  IconUser,
  IconSettings,
  IconHelpCircle,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

const mainLinksData = [
  { icon: IconHome2, label: 'Home', path: '/' },
  { icon: IconSchool, label: 'Academics', path: '/academics' },
  { icon: IconBook, label: 'Program & Curriculum', path: '/program' },
  { icon: IconFileText, label: 'Examination', path: '/examination' },
];

const footerLinksData = [
  { icon: IconUser, label: 'Profile', path: '/profile' },
  { icon: IconSettings, label: 'Settings', path: '/vms/settings' },
  { icon: IconHelpCircle, label: 'Help', path: '/help' },
];

export function Sidebar() {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const renderLink = (link) => {
    const active = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
    
    return (
      <Tooltip label={link.label} position="right" disabled={hovered} key={link.label}>
        <UnstyledButton
          onClick={() => navigate(link.path)}
          className={`sidebar-link ${active ? 'active' : ''}`}
          style={{ width: '100%' }}
        >
          <link.icon style={{ width: rem(22), height: rem(22) }} stroke={1.5} />
          {hovered && (
            <Text className="sidebar-label" size="sm">
              {link.label}
            </Text>
          )}
        </UnstyledButton>
      </Tooltip>
    );
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      h="100%"
      p="md"
      style={{
        width: hovered ? rem(260) : rem(80),
        transition: 'width 0.3s ease',
        borderRight: `${rem(1)} solid var(--erp-border)`,
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}
    >
      <Stack justify="space-between" h="100%" gap={0}>
        <Stack gap={4}>
          {mainLinksData.map(renderLink)}
          <Box py="md" px="xs">
             <Text size="xs" fw={700} c="dimmed" style={{ display: hovered ? 'block' : 'none', textTransform: 'uppercase', letterSpacing: rem(1) }}>
                Miscellaneous
             </Text>
             {!hovered && <Box h={rem(1)} bg="var(--erp-border)" my="sm" />}
          </Box>
        </Stack>

        <Stack gap={4}>
          {footerLinksData.map(renderLink)}
        </Stack>
      </Stack>
    </Box>
  );
}
