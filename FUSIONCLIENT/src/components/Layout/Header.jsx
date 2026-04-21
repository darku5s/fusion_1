import { Group, Text, ActionIcon, Avatar, Box, rem, Select } from '@mantine/core';
import { IconBell, IconChevronDown } from '@tabler/icons-react';
import logo from '../../assets/iiitdm_logo.png';

export function Header() {
  return (
    <Group h="100%" px="md" justify="space-between" align="center" style={{ borderBottom: `${rem(1)} solid var(--erp-border)`, background: 'white' }}>
      <Group gap="md">
        <img src={logo} alt="IIITDM Logo" style={{ height: rem(40) }} />
        <Box visibleFrom="sm">
          <Text fw={700} size="xl" style={{ lineHeight: 1.1, color: 'var(--erp-blue)' }}>
            FUSION
          </Text>
          <Text size="xs" c="dimmed" fw={600}>
            IIITDMJ's ERP Portal
          </Text>
        </Box>
      </Group>

      <Group gap="lg">
        <Select
          value="student"
          data={[{ value: 'student', label: 'student' }]}
          rightSection={<IconChevronDown size={14} />}
          variant="filled"
          radius="md"
          size="sm"
          styles={{
            input: {
              backgroundColor: '#e7f5ff',
              color: '#1971c2',
              fontWeight: 600,
              width: rem(120),
            },
          }}
          readOnly
        />
        
        <Group gap="sm">
          <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
            <IconBell size={20} />
            <Box
              style={{
                position: 'absolute',
                top: rem(5),
                right: rem(5),
                width: rem(8),
                height: rem(8),
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                border: '2px solid white',
              }}
            />
          </ActionIcon>
          
          <Avatar 
            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-9.png" 
            radius="xl" 
            size="md" 
            style={{ border: '2px solid var(--erp-blue-light)' }}
          />
        </Group>
      </Group>
    </Group>
  );
}
