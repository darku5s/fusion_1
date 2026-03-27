import { Table, Badge, Card, Text } from '@mantine/core';
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
      <Card shadow="sm" p="md" radius="md" withBorder mb="md">
        <Text weight={700} mb="sm">
          {title}
        </Text>
        <Text color="dimmed">No data available.</Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="md">
      <Text weight={700} mb="sm">
        {title}
      </Text>
      <Table highlightOnHover striped>
        <thead>
          <tr>
            <th>Visit ID</th>
            <th>Visitor</th>
            <th>Purpose</th>
            <th>Host</th>
            <th>Status</th>
            <th>Registered At</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((visit) => {
            const status = mapVisitStatus(visit.status).toLowerCase();
            return (
              <tr key={visit.id}>
                <td>{visit.id}</td>
                <td>{visit.visitor?.full_name || '-'}</td>
                <td>{visit.purpose || '-'}</td>
                <td>{visit.host_name || '-'}</td>
                <td>
                  <Badge color={statusColors[status] || 'gray'}>
                    {mapVisitStatus(visit.status)}
                  </Badge>
                </td>
                <td>{visit.registered_at ? new Date(visit.registered_at).toLocaleString() : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}

export default VmsTable;
