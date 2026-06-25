export class SettingsController {
  constructor(moduleHost, automationHost) {
    this.moduleHost = moduleHost;
    this.automationHost = automationHost;
  }

  encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  decode(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  capture() {
    const settings = this.moduleHost.captureSettings();
    settings.v = 3;
    const automations = this.automationHost?.captureSettings();
    if (automations?.length) settings.automations = automations;
    return settings;
  }

  persistToUrl() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        const json = JSON.stringify(this.capture());
        url.searchParams.set('settings', this.encode(json));
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.warn(`Impossible de sauvegarder les paramètres dans l'URL :`, err);
      }
    }, 500);
  }

  loadFromUrl() {
    try {
      const url = new URL(window.location.href);
      const encoded = url.searchParams.get('settings');
      if (!encoded) return;
      const decoded = this.decode(encoded);
      const settings = JSON.parse(decoded);
      if (!settings || typeof settings !== 'object') return;
      this.moduleHost.applySettings(settings);
    } catch (err) {
      console.warn(`Impossible de restaurer les paramètres depuis l'URL :`, err);
    }
  }

  bindPersistence(handler) {
    this.moduleHost.bindPersistenceListeners(handler);
  }
}