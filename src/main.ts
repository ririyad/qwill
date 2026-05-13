import { mount } from 'svelte';
import App from './app.svelte';
import './styles/global.css';

const target = document.getElementById('app');

if (!target) {
  throw new Error('qwill app mount point was not found.');
}

mount(App, { target });
