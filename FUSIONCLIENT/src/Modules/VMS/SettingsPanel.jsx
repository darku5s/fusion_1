import { useState, useEffect } from 'react';
import { Card, Table, Button, Group, Title, ActionIcon, TextInput, Modal, Stack, Text } from '@mantine/core';
import { IconSettings, IconEdit, IconRefresh } from '@tabler/icons-react';
import { fetchSettings, updateSetting } from './api';
import { parseError } from './helpers';

function SettingsPanel({ token }) {
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [opened, setOpened] = useState(false);
  const [currentSetting, setCurrentSetting] = useState({ key: '', value: '', description: '' });

  const loadSettings = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchSettings(token);
      setSettingsList(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [token]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateSetting(token, currentSetting);
      setOpened(false);
      loadSettings();
    } catch (err) {
      setError(parseError(err));
      setLoading(false);
    }
  };

  const openEditor = (setting) => {
    setCurrentSetting(setting);
    setOpened(true);
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconSettings size={24} color="#4c6ef5" />
          <Title order={3}>VMS Global Settings</Title>
        </Group>
        <ActionIcon variant="light" color="blue" onClick={loadSettings} loading={loading}>
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>

      {error && <Text c="red" mb="md">{error}</Text>}

      {settingsList.length === 0 && !loading ? (
        <Text c="dimmed">No settings found in the system.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Setting Key</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th style={{ width: 80 }}>Edit</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {settingsList.map((s) => (
              <Table.Tr key={s.key}>
                <Table.Td fw={600}>{s.key}</Table.Td>
                <Table.Td><Text truncate maxWidth={250}>{s.value}</Text></Table.Td>
                <Table.Td c="dimmed" size="sm">{s.description}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="light" color="blue" onClick={() => openEditor(s)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Edit Setting" centered>
        <Stack>
          <TextInput 
            label="Setting Key" 
            value={currentSetting.key} 
            disabled 
          />
          <TextInput 
            label="Value" 
            value={currentSetting.value} 
            onChange={(e) => setCurrentSetting({ ...currentSetting, value: e.target.value })} 
          />
          <TextInput 
            label="Description" 
            value={currentSetting.description} 
            onChange={(e) => setCurrentSetting({ ...currentSetting, description: e.target.value })} 
          />
          <Button onClick={handleSave} loading={loading}>Save Changes</Button>
        </Stack>
      </Modal>
    </Card>
  );
}

export default SettingsPanel;
