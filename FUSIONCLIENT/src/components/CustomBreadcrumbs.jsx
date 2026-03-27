import { Breadcrumbs, Anchor, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

function CustomBreadcrumbs({ current }) {
  const items = [
    { title: 'Home', href: '/' },
    { title: current || 'Notifications', href: null },
  ];

  return (
    <Breadcrumbs separator=">" mt="sm" mb="md">
      {items.map((item, index) =>
        item.href ? (
          <Anchor component={Link} to={item.href} key={index} color="blue">
            {item.title}
          </Anchor>
        ) : (
          <Text key={index} color="dimmed" weight={500}>
            {item.title}
          </Text>
        )
      )}
    </Breadcrumbs>
  );
}

export default CustomBreadcrumbs;
