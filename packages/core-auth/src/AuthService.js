export class AuthService {
  constructor(provider) {
    this.provider = provider;

    this.user = null;
    this.caps = {};
  }

  async load() {
    const data = await this.provider.load();

    this.user = data.user;
    this.caps = data.capabilities;
  }

  can(feature) {
    return !!this.caps[feature];
  }

  getUser() {
    return this.user;
  }
}
