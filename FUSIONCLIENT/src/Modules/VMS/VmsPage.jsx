import { useEffect, useState, useMemo } from 'react';
import { fetchActiveVisits, fetchIncidents, fetchRecentVisits } from './api';
import LoadingSpinner from './LoadingSpinner';
import VmsForm from './VmsForm';
import VmsTable from './VmsTable';
import CustomBreadcrumbs from '../../components/CustomBreadcrumbs';
import { Button, Container, Card, Title, Text, TextInput, Group, Select, Stack, Center, Badge, Paper, ActionIcon } from '@mantine/core';
import { IconSearch, IconBell, IconSpeakerphone, IconShieldCheck, IconRefresh } from '@tabler/icons-react';
import './module.css';

function VmsPage() {
  const [token, setToken] = useState(localStorage.getItem("vms_token") || "");
  const [activeVisits, setActiveVisits] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboardData(currentToken = token) {
    if (!currentToken) return;
    try {
      setLoading(true);
      setError("");
      const [active, recent, incidentList] = await Promise.all([
        fetchActiveVisits(currentToken),
        fetchRecentVisits(currentToken),
        fetchIncidents(currentToken),
      ]);
      setActiveVisits(active);
      setRecentVisits(recent);
      setIncidents(incidentList);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load data. Check token/backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadDashboardData(token);
  }, []);

  const saveToken = () => {
    localStorage.setItem("vms_token", token);
    loadDashboardData(token);
  };

  const [activeTab, setActiveTab] = useState("notifications");
  const [sortBy, setSortBy] = useState("recent");
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const currentTabList = activeTab === 'notifications' ? notifications : announcements;

  const sortedTabList = useMemo(() => {
    if (sortBy === 'oldest') return [...currentTabList].reverse();
    return currentTabList;
  }, [currentTabList, sortBy]);

  return (
    <Container size="xl" py="xl">
      <CustomBreadcrumbs current="Dashboard" />
      
      <Group justify="space-between" align="flex-end" mb="xl" mt="md">
        <div>
          <Title order={1} className="premium-gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            VMS Dashboard
          </Title>
          <Text c="dimmed" size="lg" mt="xs">Monitor notifications, manage visits, and secure the premises.</Text>
        </div>
        
        <Paper withBorder radius="md" p="md" className="glass-panel" style={{ minWidth: 400 }}>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm">System Authentication</Text>
            {error && <Badge color="red" variant="light">Error Connecting</Badge>}
          </Group>
          <Group mt="xs" align="center">
            <TextInput 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              placeholder="Enter DRF Token..." 
              style={{ flex: 1 }} 
              type="password"
              leftSection={<IconShieldCheck size={16} />}
            />
            <Button variant="gradient" gradient={{ from: 'violet', to: 'blue' }} onClick={saveToken}>Save</Button>
            <ActionIcon variant="light" color="violet" size="lg" onClick={() => loadDashboardData(token)}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>
        </Paper>
      </Group>

      <Card shadow="xl" p="xl" radius="lg" withBorder mb="xl" className="glass-panel">
        <Group justify="space-between" mb="lg">
          <Group gap="sm">
            <Button 
              size="md"
              radius="xl"
              leftSection={<IconBell size={18} />}
              variant={activeTab === 'notifications' ? 'gradient' : 'subtle'} 
              gradient={activeTab === 'notifications' ? { from: 'violet', to: 'blue' } : undefined}
              color="violet" 
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </Button>
            <Button 
              size="md"
              radius="xl"
              leftSection={<IconSpeakerphone size={18} />}
              variant={activeTab === 'announcements' ? 'gradient' : 'subtle'} 
              gradient={activeTab === 'announcements' ? { from: 'violet', to: 'blue' } : undefined}
              color="violet" 
              onClick={() => setActiveTab('announcements')}
            >
              Announcements
            </Button>
          </Group>
          <Select
            value={sortBy}
            onChange={(val) => setSortBy(val || 'recent')}
            data={[{ value: 'recent', label: 'Most Recent' }, { value: 'oldest', label: 'Oldest' }]}
            radius="xl"
            style={{ width: 180 }}
          />
        </Group>

        {sortedTabList.length === 0 ? (
          <Center p="xl" style={{ minHeight: 250 }}>
            <Stack align="center" gap="sm">
              <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(121, 80, 242, 0.1)' }}>
                <IconSearch size={48} color="#7950f2" />
              </div>
              <Title order={3} mt="md">No new {activeTab}!</Title>
              <Text c="dimmed">You're all caught up. Check back later for updates.</Text>
            </Stack>
          </Center>
        ) : (
          <Stack>
            {sortedTabList.map((item) => (
              <Card key={item.id || item.title} shadow="sm" p="md" radius="md" withBorder>
                <Text fw={700}>{item.title || 'Untitled'}</Text>
                <Text size="sm" c="dimmed">{item.message || item.description}</Text>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      <VmsForm token={token} onActionSuccess={() => loadDashboardData(token)} />

      {loading ? (
        <Center py="xl" style={{ minHeight: 300 }}><LoadingSpinner /></Center>
      ) : (
        <Stack gap="xl" mt="xl">
          <VmsTable rows={activeVisits} title="Active Visits" />
          <VmsTable rows={recentVisits} title="Recent Visits" />

          <Card shadow="xl" p="xl" radius="lg" withBorder className="glass-panel">
            <Group mb="md" align="center">
              <IconShieldCheck size={28} color="#f03e3e" />
              <Title order={3}>Security Incidents Log</Title>
            </Group>
            
            {incidents.length === 0 ? (
              <Paper p="xl" radius="md" bg="gray.0" withBorder>
                <Text c="dimmed" ta="center">No security incidents reported. The premises are secure!</Text>
              </Paper>
            ) : (
              <Stack mt="sm" gap="md">
                {incidents.map((incident) => (
                  <Card key={incident.id} radius="md" withBorder shadow="sm" style={{ borderLeft: '4px solid #f03e3e' }}>
                    <Group justify="space-between">
                      <Text fw={700} size="lg">{incident.issue_type}</Text>
                      <Badge color="red" variant="light">Severity: {incident.severity}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mt="xs">{incident.description}</Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>
      )}
    </Container>
  );
}

export default VmsPage;
