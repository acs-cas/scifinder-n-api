export enum SearchType {
    Substances = 'Substances',
    Reactions = 'Reactions',
    References = 'References',
    Suppliers = 'Suppliers'
}

export enum WindowSize {
    width = 375,
    height = 514
}

export enum WindowResize {
    ProxySettingsElementHeight = 176,
    Padding = 60,
    ErrorMessageHeight = 25
}

export enum ContentType {
    CDXML = 'chemical/x-cdxml',
    JSON = 'application/json'
}

export enum API {
    Path = '/api/v1/'
}

export enum APIStorageKeys {
    PROXY_URL = 'proxy_url'
}

export enum ScifinderNUrls {
    production = 'https://scifinder-n.cas.org'
}
