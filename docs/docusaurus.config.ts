import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'REeve',
  tagline: 'AI-powered binary reverse engineering assistant',
  favicon: 'img/favicon.png',

  url: 'https://reeve.kunull.net',
  baseUrl: '/docs/',

  organizationName: 'Kunull',
  projectName: 'REeve',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          breadcrumbs: false,
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/Kunull/REeve/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      items: [
        {
          type: 'html',
          position: 'left',
          value:
            '<a href="https://reeve.kunull.net/" class="navbar-brand-reeve" data-text="R33V3" aria-label="REeve home">REEVE</a>' +
            '<span class="navbar-brand-sep">/</span>' +
            '<span class="navbar-brand-section">Documentation</span>',
        },
        {
          href: 'https://github.com/Kunull/REeve',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'python', 'json'],
    },
    mermaid: {
      theme: {light: 'base', dark: 'base'},
      options: {
        fontFamily: "'JetBrains Mono', monospace",
        themeVariables: {
          background: '#000000',
          primaryColor: '#111111',
          primaryTextColor: '#e5e5e5',
          primaryBorderColor: '#333333',
          lineColor: '#666666',
          secondaryColor: '#111111',
          tertiaryColor: '#0a0a0a',
          textColor: '#e5e5e5',
          nodeTextColor: '#e5e5e5',
        },
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
