import { useState } from 'react';
import { Card, TextInput, Group, Button, Select, Stack, Title, Divider, Textarea } from '@mantine/core';
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
      onActionSuccess();
    } catch (error) {
      setMessage(parseError(error));
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
          <TextInput label="ID number" value={registerData.id_number} onChange={(e) => setRegisterData({ ...registerData, id_number: e.target.value })} />
        </Group>

        <Group grow>
          <Select
            label="ID type"
            data={[{ value: 'passport', label: 'Passport' }, { value: 'aadhaar', label: 'Aadhaar' }, { value: 'driver', label: 'Driver License' }]}
            value={registerData.id_type}
            onChange={(value) => setRegisterData({ ...registerData, id_type: value || 'passport' })}
          />
          <TextInput label="Phone" value={registerData.contact_phone} onChange={(e) => setRegisterData({ ...registerData, contact_phone: e.target.value })} />
        </Group>

        <Group grow>
          <TextInput label="Email" value={registerData.contact_email} onChange={(e) => setRegisterData({ ...registerData, contact_email: e.target.value })} />
          <TextInput label="Host name" value={registerData.host_name} onChange={(e) => setRegisterData({ ...registerData, host_name: e.target.value })} />
        </Group>

        <TextInput label="Host department" value={registerData.host_department} onChange={(e) => setRegisterData({ ...registerData, host_department: e.target.value })} />
        <TextInput label="Purpose" value={registerData.purpose} onChange={(e) => setRegisterData({ ...registerData, purpose: e.target.value })} />

        <Button loading={busy} onClick={() => runAction('register')}>
          Register Visitor
        </Button>

        <Divider label="Quick Actions" labelPosition="center" />

        <Group grow>
          <TextInput label="Visit ID" value={visitId} onChange={(e) => setVisitId(e.target.value)} />
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
        </Group>

        <Title order={5}>Response</Title>
        <Textarea value={message || 'No action yet.'} minRows={5} readOnly />
      </Stack>
    </Card>
  );
}

export default VmsForm;

