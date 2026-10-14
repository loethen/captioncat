import './styles.css';
import { bindSettingsForm } from './settings-form.js';

bindSettingsForm();
document.querySelector('#open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
