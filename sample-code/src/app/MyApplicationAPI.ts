export interface MyApplicationAPI {
    window: {
        close(): void,
        resizeTo(width, height): void
    };
    activeDocument: {
        selection: {
            getSVG(options): string;
            getCDXML(): string;
        }
    };
    openURLInDefaultBrowser(url): void;
    registerURLTriggeredCallback(callback): string;
}
