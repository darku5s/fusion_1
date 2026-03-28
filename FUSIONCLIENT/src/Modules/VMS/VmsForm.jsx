import { useState } from 'react';
import { Card, TextInput, Group, Button, Select, Stack, Title, Divider, Checkbox, ScrollArea, Text } from '@mantine/core';
import { denyEntry, issuePass, recordEntry, recordExit, registerVisitor, verifyVisitor, fetchActiveVisits, fetchRecentVisits } from './api';
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
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);

  async function runAction(action) {
    if (!token) {
      setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ERROR: Please enter auth token first.`, ...prev]);
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
      const newLog = `[${new Date().toLocaleTimeString()}] ${action.toUpperCase()} SUCCESS:\n${JSON.stringify(response, null, 2)}`;
      setLogs((prev) => [newLog, ...prev]);
      
      if (action === 'register') {
        setRegisterData(initialRegister);
      }
      
      onActionSuccess();
    } catch (error) {
      const errLog = `[${new Date().toLocaleTimeString()}] ${action.toUpperCase()} ERROR:\n${parseError(error)}`;
      setLogs((prev) => [errLog, ...prev]);
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    if (!token || !visitId) {
      setLogs((prev) => [`[${new Date().toLocaleTimeString()}] CHECK STATUS ERROR: Please enter Visit ID.`, ...prev]);
      return;
    }
    try {
      setBusy(true);
      const [active, recent] = await Promise.all([fetchActiveVisits(token), fetchRecentVisits(token, 100)]);
      const v = [...active, ...recent].find(val => String(val.id) === String(visitId));
      if (v) {
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] CHECK STATUS - ID ${visitId}:\nVisitor: ${v.visitor?.full_name || 'N/A'}\nStatus: ${v.status.toUpperCase()}`, ...prev]);
      } else {
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] CHECK STATUS - ID ${visitId}: Not found.`, ...prev]);
      }
    } catch (error) {
      setLogs((prev) => [`[${new Date().toLocaleTimeString()}] CHECK STATUS ERROR:\n${parseError(error)}`, ...prev]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder mb="md">
      <Title order={4} mb="sm">
        VMS Actions
      </Title>
      <Stack spacing="xs">
        <Group grow>
          <TextInput label="Full name" value={registerData.full_name} onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })} />
          <TextInput label="ID number" value={registerData.id_number} onChange={(e) => setRegisterData({ ...registerData, id_number: e.target.value.replace(/\D/g, '') })} />
        </Group>

        <Group grow>
          <Select
            label="ID type"
            data={[{ value: 'passport', label: 'Passport' }, { value: 'aadhaar', label: 'Aadhaar' }, { value: 'driver_license', label: 'Driver License' }]}
            value={registerData.id_type}
            onChange={(value) => setRegisterData({ ...registerData, id_type: value || 'passport' })}
          />
          <TextInput label="Phone" type="tel" value={registerData.contact_phone} onChange={(e) => setRegisterData({ ...registerData, contact_phone: e.target.value.replace(/\D/g, '') })} />
        </Group>

        <Group grow>
          <TextInput label="Email (Optional)" type="email" value={registerData.contact_email} onChange={(e) => setRegisterData({ ...registerData, contact_email: e.target.value })} />
          <TextInput label="Host name" value={registerData.host_name} onChange={(e) => setRegisterData({ ...registerData, host_name: e.target.value })} />
        </Group>

        <Group grow>
          <TextInput label="Host department" value={registerData.host_department} onChange={(e) => setRegisterData({ ...registerData, host_department: e.target.value })} />
          <TextInput label="Expected duration (mins)" type="number" value={registerData.expected_duration_minutes} onChange={(e) => setRegisterData({ ...registerData, expected_duration_minutes: Number(e.target.value) })} />
        </Group>
        <TextInput label="Purpose" value={registerData.purpose} onChange={(e) => setRegisterData({ ...registerData, purpose: e.target.value })} />
        <Checkbox label="VIP Visitor" checked={registerData.is_vip} onChange={(e) => setRegisterData({ ...registerData, is_vip: e.currentTarget.checked })} mt="sm" mb="sm" />

        <Button loading={busy} onClick={() => runAction('register')}>
          Register Visitor
        </Button>

        <Divider label="Quick Actions" labelPosition="center" />

        <Group grow>
          <TextInput label="Visit ID" type="number" value={visitId} onChange={(e) => setVisitId(e.target.value)} />
          <TextInput label="Authorized zones" value={authorizedZones} onChange={(e) => setAuthorizedZones(e.target.value)} />
          <TextInput label="Gate name" value={gateName} onChange={(e) => setGateName(e.target.value)} />
        </Group>

        <Group>
          <Button color="blue" loading={busy} onClick={() => runAction('verify')}>
            Verify
          </Button>
          <Button color="cyan" loading={busy} onClick={() => runAction('issue')}>
            Issue Pass
          </Button>
          <Button color="green" loading={busy} onClick={() => runAction('entry')}>
            Record Entry
          </Button>
          <Button color="gray" loading={busy} onClick={() => runAction('exit')}>
            Record Exit
          </Button>
          <Button color="red" loading={busy} onClick={() => runAction('deny')}>
            Deny Entry
          </Button>
          <Button color="violet" loading={busy} onClick={checkStatus}>
            Check Status
          </Button>
        </Group>

        <Title order={5}>Action Logs</Title>
        <ScrollArea h={200} type="always" offsetScrollbars style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '10px' }}>
          {logs.length === 0 ? (
            <Text c="dimmed" size="sm">No logs yet.</Text>
          ) : (
            logs.map((log, i) => (
              <Text key={i} size="xs" component="pre" style={{ margin: 0, paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #eee', whiteSpace: 'pre-wrap' }}>
                {log}
              </Text>
            ))
          )}
        </ScrollArea>
      </Stack>
    </Card>
  );
}

export default VmsForm;

