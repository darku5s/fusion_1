import { useState, useEffect } from 'react';
import { Card, Table, Button, Group, Title, Badge, ActionIcon, TextInput, Stack, Text } from '@mantine/core';
import { IconTrash, IconPlus, IconRefresh } from '@tabler/icons-react';
import { fetchBlacklist, addBlacklist, removeBlacklist } from './api';
import { parseError } from './helpers';

function BlacklistManager({ token }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newId, setNewId] = useState('');
  const [newReason, setNewReason] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchBlacklist(token);
      setBlacklist(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAdd = async () => {
    if (!newId || !newReason) return;
    try {
      setLoading(true);
      await addBlacklist(token, { id_number: newId, reason: newReason });
      setNewId('');
      setNewReason('');
      loadData();
    } catch (err) {
      setError(parseError(err));
      setLoading(false);
    }
  };

  const handleRemove = async (id_number) => {
    try {
      setLoading(true);
      await removeBlacklist(token, id_number);
      loadData();
    } catch (err) {
      setError(parseError(err));
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>Restricted Visitors (Blacklist)</Title>
        <ActionIcon variant="light" color="red" onClick={loadData} loading={loading}>
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>

      {error && <Text c="red" mb="md">{error}</Text>}

      <Card p="md" mb="xl" bg="gray.0" radius="md" withBorder>
        <Group align="flex-end">
          <TextInput 
            label="ID Number" 
            placeholder="e.g. Passport/Aadhaar" 
            value={newId} 
            onChange={(e) => setNewId(e.target.value)} 
          />
          <TextInput 
            label="Restriction Reason" 
            placeholder="Why are they restricted?" 
            value={newReason} 
            onChange={(e) => setNewReason(e.target.value)} 
            style={{ flex: 1 }}
          />
          <Button color="red" leftSection={<IconPlus size={16} />} onClick={handleAdd} loading={loading}>
            Add Restriction
          </Button>
        </Group>
      </Card>

      {blacklist.length === 0 && !loading ? (
        <Text c="dimmed">No restricted visitors found.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID Number</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Active</Table.Th>
              <Table.Th>Added On</Table.Th>
              <Table.Th style={{ width: 100 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {blacklist.map((entry, idx) => (
              <Table.Tr key={entry.id_number || idx}>
                <Table.Td fw={600}>{entry.id_number}</Table.Td>
                <Table.Td>{entry.reason}</Table.Td>
                <Table.Td>
                  {entry.active ? <Badge color="red">Active</Badge> : <Badge color="green">Inactive</Badge>}
                </Table.Td>
                <Table.Td>{new Date(entry.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <ActionIcon color="gray" variant="light" onClick={() => handleRemove(entry.id_number)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}

export default BlacklistManager;
