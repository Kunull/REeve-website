import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'installation',
      label: 'Installation',
    },
    {
      type: 'category',
      label: 'Usage',
      collapsed: false,
      items: ['cli', 'goals', 'reports', 'knowledge-base'],
    },
    {
      type: 'category',
      label: 'Internals',
      items: ['architecture', 'knowledge-graph', 'llm-routing'],
    },
  ],
};

export default sidebars;
