import { Table, Badge, Card, Text, Group, ActionIcon, ScrollArea } from '@mantine/core';
import { IconUsersGroup, IconDotsVertical } from '@tabler/icons-react';
import { getStatusClass, mapVisitStatus } from './helpers';

const statusColors = {
  pass: 'blue',
  inside: 'green',
  denied: 'red',
  exited: 'gray',
  default: 'gray',
};

function VmsTable({ rows, title }) {
  if (rows.length === 0) {
    return (
      <Card shadow="xl" p="xl" radius="lg" withBorder className="glass-panel">
        <Group mb="md">
          <IconUsersGroup size={24} color="#7950f2" />
          <Text fw={700} size="lg">{title}</Text>
        </Group>
        <Text c="dimmed" ta="center" py="xl">No visitor data currently available.</Text>
      </Card>
    );
  }

  return (
    <Card shadow="xl" p="xl" radius="lg" withBorder className="glass-panel">
      <Group justify="space-between" mb="lg">
        <Group>
          <IconUsersGroup size={24} color="#7950f2" />
          <Text fw={700} size="lg">{title}</Text>
        </Group>
        <Badge variant="light" color="violet">{rows.length} Total</Badge>
      </Group>

      <ScrollArea>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Visitor Name</Table.Th>
              <Table.Th>Purpose</Table.Th>
              <Table.Th>Host</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Time Registered</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((visit) => {
              const status = mapVisitStatus(visit.status).toLowerCase();
              return (
                <Table.Tr key={visit.id}>
                  <Table.Td><Text fw={500} size="sm">#{visit.id}</Text></Table.Td>
                  <Table.Td><Text fw={600}>{visit.visitor?.full_name || '-'}</Text></Table.Td>
                  <Table.Td><Text c="dimmed" size="sm">{visit.purpose || '-'}</Text></Table.Td>
                  <Table.Td>{visit.host_name || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColors[status] || 'gray'} variant="light" radius="sm">
                      {mapVisitStatus(visit.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="sm">{visit.registered_at ? new Date(visit.registered_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</Text></Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
}

export default VmsTable;
