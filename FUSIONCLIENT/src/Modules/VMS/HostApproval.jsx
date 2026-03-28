import { useState, useEffect } from 'react';
import { Card, Table, Button, Group, Title, Badge, Text, ActionIcon } from '@mantine/core';
import { IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import { fetchActiveVisits, approveVisit, denyEntry } from './api';
import { parseError } from './helpers';

function HostApproval({ token }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchActiveVisits(token);
      let pending = data.filter(v => v.status === 'registered' || v.status === 'pending_approval');
      pending.sort((a, b) => {
        if (a.is_vip && !b.is_vip) return -1;
        if (!a.is_vip && b.is_vip) return 1;
        return 0;
      });
      setVisits(pending);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleApprove = async (visitId) => {
    try {
      await approveVisit(token, { visit_id: visitId });
      loadData();
    } catch (err) {
      alert(parseError(err));
    }
  };

  const handleDeny = async (visitId) => {
    try {
      await denyEntry(token, { visit_id: visitId, reason: "Host Rejected", remarks: "Denied via Host Portal", escalated: false });
      loadData();
    } catch (err) {
      alert(parseError(err));
    }
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>Pending Host Approvals</Title>
        <ActionIcon variant="light" color="blue" onClick={loadData} loading={loading}>
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>

      {error && <Text c="red" mb="md">{error}</Text>}

      {visits.length === 0 && !loading ? (
        <Text c="dimmed">No pending visits require your approval right now.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Visitor Name</Table.Th>
              <Table.Th>Host Name</Table.Th>
              <Table.Th>Purpose</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visits.map(v => (
              <Table.Tr key={v.id} bg={v.is_vip ? 'yellow.0' : undefined} style={v.is_vip ? { borderLeft: '4px solid #fcc419' } : {}}>
                <Table.Td>{v.id}</Table.Td>
                <Table.Td>
                  {v.visitor_name}
                  {v.is_vip && <Badge color="yellow" size="sm" ml="xs">VIP</Badge>}
                </Table.Td>
                <Table.Td>{v.host_name}</Table.Td>
                <Table.Td>{v.purpose}</Table.Td>
                <Table.Td><Badge color="blue">{v.status}</Badge></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" color="green" leftSection={<IconCheck size={14} />} onClick={() => handleApprove(v.id)}>
                      Approve
                    </Button>
                    <Button size="xs" color="red" leftSection={<IconX size={14} />} onClick={() => handleDeny(v.id)}>
                      Reject
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}

export default HostApproval;
