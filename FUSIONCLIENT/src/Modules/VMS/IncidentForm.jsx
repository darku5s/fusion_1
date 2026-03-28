import { useState } from 'react';
import { Card, TextInput, Select, Textarea, Button, Title, Stack } from '@mantine/core';
import { reportIncident } from './api';
import { parseError } from './helpers';

function IncidentForm({ token, onActionSuccess }) {
  const [data, setData] = useState({
    severity: 'low',
    issue_type: 'other',
    description: '',
    visit_id: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit() {
    setBusy(true);
    setMsg('');
    try {
      const payload = {
        severity: data.severity,
        issue_type: data.issue_type,
        description: data.description,
      };
      if (data.visit_id) {
        payload.visit_id = Number(data.visit_id);
      }
      const response = await reportIncident(token, payload);
      setMsg(`Success: ${response.message || 'Incident logged'}`);
      setData({ severity: 'low', issue_type: 'other', description: '', visit_id: '' });
      if (onActionSuccess) onActionSuccess();
    } catch (e) {
      setMsg(parseError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder mb="md">
      <Title order={4} mb="sm">Report Security Incident</Title>
      <Stack spacing="xs">
        <Select
          label="Severity"
          data={[
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
          value={data.severity}
          onChange={(v) => setData({ ...data, severity: v })}
        />
        <Select
          label="Issue Type"
          data={[
            { value: 'unauthorized_access', label: 'Unauthorized Access' },
            { value: 'policy_violation', label: 'Policy Violation' },
            { value: 'equipment_failure', label: 'Equipment Failure' },
            { value: 'suspicious_behavior', label: 'Suspicious Behavior' },
            { value: 'other', label: 'Other' },
          ]}
          value={data.issue_type}
          onChange={(v) => setData({ ...data, issue_type: v })}
        />
        <TextInput 
          label="Related Visit ID (Optional)" 
          type="number"
          placeholder="e.g. 1" 
          value={data.visit_id} 
          onChange={(e) => setData({ ...data, visit_id: e.target.value })} 
        />
        <Textarea 
          label="Description" 
          required 
          value={data.description} 
          onChange={(e) => setData({ ...data, description: e.target.value })} 
        />
        <Button color="red" loading={busy} onClick={handleSubmit}>Log Incident</Button>
        {msg && <div style={{ color: msg.startsWith('Success') ? 'green' : 'red', marginTop: '10px' }}>{msg}</div>}
      </Stack>
    </Card>
  );
}

export default IncidentForm;
