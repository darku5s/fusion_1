import { useState, useEffect } from 'react';
import { Card, Button, Group, Title, ActionIcon, Stack, Text, SimpleGrid, Paper, ThemeIcon, FileInput } from '@mantine/core';
import { IconChartBar, IconRefresh, IconDownload, IconUpload, IconUsers, IconAlertTriangle } from '@tabler/icons-react';
import { fetchReports, exportData, importData } from './api';
import { parseError } from './helpers';

function ReportsDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const loadReports = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchReports(token);
      setStats(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [token]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const data = await exportData(token);
      // For a real file download, we would create an Object URL.
      // Assuming the API returns a base64 string or JSON for now.
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vms_export.json';
      a.click();
    } catch (err) {
      setError("Export failed: " + parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      await importData(token, formData);
      setFile(null);
      loadReports();
    } catch (err) {
      setError("Import failed: " + parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs" className="text-secondary">{title}</Text>
          <Text fw={700} size="xl">{value}</Text>
        </div>
        <ThemeIcon color={color} variant="light" size={38} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );

  return (
    <Stack>
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconChartBar size={24} color="#228be6" />
            <Title order={3}>VMS Analytics</Title>
          </Group>
          <ActionIcon variant="light" color="blue" onClick={loadReports} loading={loading}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        {error && <Text c="red" mb="md">{error}</Text>}

        {!stats && !loading ? (
          <Text c="dimmed">No statistics available. Please refresh.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <StatCard 
              title="Total Visits" 
              value={stats?.total_visits || 0} 
              icon={<IconUsers size={20} />} 
              color="blue" 
            />
            <StatCard 
              title="Active Visitors" 
              value={stats?.active_visits || 0} 
              icon={<IconUsers size={20} />} 
              color="teal" 
            />
            <StatCard 
              title="Security Incidents" 
              value={stats?.total_incidents || 0} 
              icon={<IconAlertTriangle size={20} />} 
              color="red" 
            />
          </SimpleGrid>
        )}
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={4} mb="md">Data Management</Title>
        <Group align="flex-end">
          <Button 
            variant="outline" 
            leftSection={<IconDownload size={16} />} 
            onClick={handleExport}
            loading={loading}
          >
            Export All Visitor Data
          </Button>

          <Paper withBorder p="xs" radius="md" bg="gray.0" ml="auto">
            <Group>
              <FileInput 
                placeholder="Choose file (.json, .csv)" 
                value={file} 
                onChange={setFile} 
                style={{ width: 250 }}
              />
              <Button 
                color="teal" 
                leftSection={<IconUpload size={16} />} 
                onClick={handleImport}
                disabled={!file}
                loading={loading}
              >
                Import Data
              </Button>
            </Group>
          </Paper>
        </Group>
      </Card>
    </Stack>
  );
}

export default ReportsDashboard;
