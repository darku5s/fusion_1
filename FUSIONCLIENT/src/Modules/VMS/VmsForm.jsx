import { useState } from 'react';
import { Card, TextInput, Group, Button, Select, Stack, Title, Divider, Textarea, Paper, Text, Grid } from '@mantine/core';
import { IconUserPlus, IconId, IconClipboardCheck, IconTerminal2 } from '@tabler/icons-react';
import { denyEntry, issuePass, recordEntry, recordExit, registerVisitor, verifyVisitor } from './api';
import { parseError } from './helpers';

const initialRegister = {
  full_name: '',
  id_number: '',
  id_type: 'passport',
  contact_phone: '',
  contact_email: '',
  photo_reference: '',
  purpose: '',
  host_name: '',
  host_department: '',
  host_contact: '',
  expected_duration_minutes: 60,
  is_vip: false,
};

function VmsForm({ token, onActionSuccess }) {
  const [registerData, setRegisterData] = useState(initialRegister);
  const [visitId, setVisitId] = useState('');
  const [gateName, setGateName] = useState('Main Gate');
  const [authorizedZones, setAuthorizedZones] = useState('public');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function runAction(action) {
    if (!token) {
      setMessage('Please enter auth token first.');
      return;
    }
    try {
      setBusy(true);
      let response;
      if (action === 'register') response = await registerVisitor(token, registerData);
      if (action === 'verify') response = await verifyVisitor(token, { visit_id: Number(visitId), method: 'manual', result: true });
      if (action === 'issue') response = await issuePass(token, { visit_id: Number(visitId), authorized_zones: authorizedZones });
      if (action === 'entry') response = await recordEntry(token, { visit_id: Number(visitId), gate_name: gateName, items_declared: '' });
      if (action === 'exit') response = await recordExit(token, { visit_id: Number(visitId), gate_name: gateName, items_declared: '' });
      if (action === 'deny') response = await denyEntry(token, { visit_id: Number(visitId), reason: 'Denied by security', remarks: 'Manual deny', escalated: false });
      setMessage(JSON.stringify(response, null, 2));
      onActionSuccess?.();
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card shadow="xl" p="xl" radius="lg" withBorder mb="xl" className="glass-panel">
      <Group mb="lg">
        <IconClipboardCheck size={28} color="#7950f2" />
        <Title order={3}>VMS Operations Manager</Title>
      </Group>
      
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Paper withBorder p="md" radius="md">
              <Group mb="xs">
                <IconUserPlus size={18} color="#7950f2" />
                <Text fw={600}>New Visitor Registration</Text>
              </Group>
              
              <Stack gap="sm">
                <Group grow>
                  <TextInput label="Full Name" placeholder="John Doe" value={registerData.full_name} onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })} />
                  <TextInput label="ID Number" placeholder="AB1234567" value={registerData.id_number} onChange={(e) => setRegisterData({ ...registerData, id_number: e.target.value })} />
                </Group>
                <Group grow>
                  <Select
                    label="ID Type"
                    data={[{ value: 'passport', label: 'Passport' }, { value: 'aadhaar', label: 'Aadhaar' }, { value: 'driver', label: 'Driver License' }]}
                    value={registerData.id_type}
                    onChange={(value) => setRegisterData({ ...registerData, id_type: value || 'passport' })}
                  />
                  <TextInput label="Contact Phone" placeholder="+1 234 567 8900" value={registerData.contact_phone} onChange={(e) => setRegisterData({ ...registerData, contact_phone: e.target.value })} />
                </Group>
                <Group grow>
                  <TextInput label="Contact Email" placeholder="john@example.com" value={registerData.contact_email} onChange={(e) => setRegisterData({ ...registerData, contact_email: e.target.value })} />
                  <TextInput label="Host Name" placeholder="Jane Smith" value={registerData.host_name} onChange={(e) => setRegisterData({ ...registerData, host_name: e.target.value })} />
                </Group>
                <Group grow>
                  <TextInput label="Host Department" placeholder="Engineering" value={registerData.host_department} onChange={(e) => setRegisterData({ ...registerData, host_department: e.target.value })} />
                  <TextInput label="Purpose of Visit" placeholder="Meeting" value={registerData.purpose} onChange={(e) => setRegisterData({ ...registerData, purpose: e.target.value })} />
                </Group>
                
                <Button 
                  mt="md" 
                  fullWidth 
                  variant="gradient" 
                  gradient={{ from: 'violet', to: 'blue' }} 
                  loading={busy} 
                  onClick={() => runAction('register')}
                  leftSection={<IconUserPlus size={16} />}
                >
                  Register Visitor
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="md" h="100%">
            <Paper withBorder p="md" radius="md">
              <Group mb="xs">
                <IconId size={18} color="#7950f2" />
                <Text fw={600}>Quick Actions</Text>
              </Group>
              
              <Stack gap="sm">
                <Group grow>
                  <TextInput label="Visit ID" placeholder="123" value={visitId} onChange={(e) => setVisitId(e.target.value)} />
                  <TextInput label="Gate Name" placeholder="Main Gate" value={gateName} onChange={(e) => setGateName(e.target.value)} />
                </Group>
                <TextInput label="Authorized Zones" placeholder="public, IT" value={authorizedZones} onChange={(e) => setAuthorizedZones(e.target.value)} />

                <Group mt="xs">
                  <Button style={{ flex: 1 }} variant="light" color="blue" loading={busy} onClick={() => runAction('verify')}>
                    Verify
                  </Button>
                  <Button style={{ flex: 1 }} variant="light" color="cyan" loading={busy} onClick={() => runAction('issue')}>
                    Issue Pass
                  </Button>
                </Group>
                <Group>
                  <Button style={{ flex: 1 }} variant="light" color="green" loading={busy} onClick={() => runAction('entry')}>
                    Entry
                  </Button>
                  <Button style={{ flex: 1 }} variant="light" color="gray" loading={busy} onClick={() => runAction('exit')}>
                    Exit
                  </Button>
                  <Button style={{ flex: 1 }} variant="light" color="red" loading={busy} onClick={() => runAction('deny')}>
                    Deny
                  </Button>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Group mb="xs">
                <IconTerminal2 size={18} color="gray" />
                <Text fw={600} c="dimmed">System Terminal</Text>
              </Group>
              <Textarea 
                value={message || 'Awaiting input...'} 
                minRows={5} 
                readOnly 
                styles={{ input: { fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#f8f9fa' } }}
                style={{ flexGrow: 1 }}
              />
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

export default VmsForm;
